// VOE AniSkip Content Script
// Integrates AniSkip with VOE.sx's JWPlayer
// Enhanced with persistent volume, playback position, language, auto-play after skip

(function() {
  'use strict';

  // Don't run on AniWorld main page - only in iframes
  if (window.location.hostname.includes('aniworld.to')) {
    return;
  }

  // Don't run if we're the top window (not in an iframe)
  // unless directly on a VOE domain
  if (window.self === window.top && !window.location.hostname.includes('voe')) {
    return;
  }

  // Check if this is a VOE player page (has JWPlayer)
  function isVOEPage() {
    if (document.querySelector('.jw-video') || 
        document.querySelector('.jw-wrapper') ||
        document.querySelector('#jw-loader')) {
      return true;
    }
    if (typeof window.jwplayer === 'function') {
      return true;
    }
    if (document.querySelector('video')) {
      return true;
    }
    return false;
  }

  // Wait for VOE player to be ready
  function waitForVOE(callback, maxAttempts = 20) {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (isVOEPage()) {
        callback();
        return;
      }
      if (attempts < maxAttempts) {
        setTimeout(check, 500);
      }
    };
    check();
  }

  // Main extension code
  function runExtension() {
    console.log('VOE AniSkip: Content script running on', window.location.href);

  let state = {
    player: null,
    skipTimes: [],
    currentMalId: null,
    currentEpisode: null,
    currentSeason: null,
    currentVideoId: null,
    settings: {
      autoSkipOp: false,
      autoSkipEd: false,
      autoSkipRecap: false,
      showButtons: true,
      skipOffset: 0,
      playAfterSkip: true,
      persistentVolume: true,
      persistentPlaybackPosition: true,
      playbackPositionExpirationDays: 7,
      markerColorOp: '#ff00fb',
      markerColorEd: '#ff00fb',
      markerColorRecap: '#ffdd00',
      markerOpacity: 0.5
    },
    ui: { container: null, skipButton: null, panel: null },
    skippedSegments: new Set(),
    initialized: false,
    playbackPositionRestored: false
  };

  const SKIP_TYPE_LABELS = {
    'op': 'Opening',
    'ed': 'Ending',
    'mixed-op': 'Mixed Opening',
    'mixed-ed': 'Mixed Ending',
    'recap': 'Recap'
  };

  function isInIframe() {
    try { return window.self !== window.top; }
    catch (e) { return true; }
  }

  async function getAniWorldInfo() {
    try {
      const result = await browser.storage.local.get('aniWorldInfo');
      if (result.aniWorldInfo && Date.now() - result.aniWorldInfo.timestamp < 5 * 60 * 1000) {
        return result.aniWorldInfo;
      }
    } catch (e) { console.log('VOE AniSkip: Could not get AniWorld info', e); }
    return null;
  }

  function parseAnimeInfo() {
    const title = document.title || '';
    const ogTitle = document.querySelector('meta[name="og:title"]')?.content || '';
    let sourceTitle = (ogTitle || title)
      .replace(/^Watch\s+/i, '')
      .replace(/\s*-\s*VOE.*$/i, '')
      .trim();
    
    const sXeXPattern = /^(.+?)[\._\s]+S(\d+)E(\d+)/i;
    let match = sourceTitle.match(sXeXPattern);
    
    if (match) {
      let animeName = match[1].replace(/\./g, ' ').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      return { animeName, season: parseInt(match[2], 10), episode: parseInt(match[3], 10) };
    }
    
    const patterns = [
      /^(.+?)[\s\-_]+(?:Episode|Ep\.?|E)?[\s\-_]*(\d{1,3})(?:[\s\-_]|$)/i,
      /^(.+?)\s+(\d{1,3})(?:\s|$)/i
    ];

    for (const pattern of patterns) {
      match = sourceTitle.match(pattern);
      if (match) {
        let animeName = match[1].replace(/\./g, ' ').replace(/_/g, ' ').replace(/\s+/g, ' ')
          .replace(/\s*(German|English|Japanese|Subbed|Dubbed|Sub|Dub|1080p|720p|480p|AAC|WebRip|x264|x265|HEVC|BluRay|BDRip|WEB-DL|WEBRip|HDRip|\.mp4|\.mkv).*$/gi, '').trim();
        const episode = parseInt(match[2], 10);
        if (animeName && episode) return { animeName, season: 1, episode };
      }
    }
    return null;
  }

  function generateVideoId(animeInfo) {
    if (!animeInfo) return null;
    return `${animeInfo.animeName.toLowerCase().replace(/\s+/g, '_')}_s${animeInfo.season || 1}_e${animeInfo.episode}`;
  }

  function waitForPlayer(timeout = 2000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          if (typeof window.jwplayer === 'function') {
            const player = window.jwplayer();
            if (player && typeof player.getState === 'function' && player.getState()) {
              resolve(player);
              return;
            }
          }
          const videoEl = document.querySelector('video');
          if (videoEl && typeof window.jwplayer === 'function') {
            const player = window.jwplayer();
            if (player && player.getContainer) {
              resolve(player);
              return;
            }
          }
        } catch (e) {}
        
        if (Date.now() - startTime > timeout) {
          const videoEl = document.querySelector('video');
          if (videoEl) {
            resolve(createVideoWrapper(videoEl));
            return;
          }
          reject(new Error('Player not found'));
          return;
        }
        setTimeout(check, 200);
      };
      check();
    });
  }

  function createVideoWrapper(videoEl) {
    return {
      _video: videoEl,
      _listeners: {},
      getState() { return videoEl.paused ? 'paused' : (videoEl.ended ? 'complete' : 'playing'); },
      getDuration() { return videoEl.duration || 0; },
      getPosition() { return videoEl.currentTime || 0; },
      getVolume() { return Math.round(videoEl.volume * 100); },
      getMute() { return videoEl.muted; },
      setVolume(vol) { videoEl.volume = vol / 100; },
      setMute(muted) { videoEl.muted = muted; },
      seek(time) { videoEl.currentTime = time; },
      play() { return videoEl.play(); },
      pause() { videoEl.pause(); },
      on(event, callback) {
        const eventMap = { 'time': 'timeupdate', 'seek': 'seeked', 'meta': 'loadedmetadata', 'complete': 'ended', 'volume': 'volumechange' };
        videoEl.addEventListener(eventMap[event] || event, callback);
      },
      getContainer() { return videoEl.parentElement; },
      isNativeWrapper: true
    };
  }

  // Persistent Volume
  async function loadPersistentVolume() {
    if (!state.settings.persistentVolume || !state.player) return;
    try {
      const result = await browser.storage.local.get(['persistentVolume', 'persistentMuted']);
      if (result.persistentVolume !== undefined) state.player.setVolume(result.persistentVolume);
      if (result.persistentMuted !== undefined) state.player.setMute(result.persistentMuted);
    } catch (e) { console.error('VOE AniSkip: Error loading volume:', e); }
  }

  async function savePersistentVolume() {
    if (!state.settings.persistentVolume || !state.player) return;
    try {
      await browser.storage.local.set({ 
        persistentVolume: state.player.getVolume(),
        persistentMuted: state.player.getMute()
      });
    } catch (e) {}
  }

  function setupPersistentVolume() {
    if (!state.settings.persistentVolume || !state.player) return;
    loadPersistentVolume();
    state.player.on('volume', savePersistentVolume);
    const video = document.querySelector('video');
    if (video) video.addEventListener('volumechange', savePersistentVolume);
  }

  // Persistent Playback Position
  function getPlaybackPositionKey() {
    return state.currentVideoId ? `playbackPosition_${state.currentVideoId}` : null;
  }

  async function loadPlaybackPosition() {
    if (!state.settings.persistentPlaybackPosition || !state.player || state.playbackPositionRestored) return;
    const key = getPlaybackPositionKey();
    if (!key) return;
    try {
      const result = await browser.storage.local.get(key);
      const data = result[key];
      if (data && data.position) {
        const expirationMs = state.settings.playbackPositionExpirationDays * 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp < expirationMs) {
          const duration = state.player.getDuration();
          if (duration && data.position < duration - 30) {
            console.log('VOE AniSkip: Restoring position to', data.position);
            state.player.seek(data.position);
            state.playbackPositionRestored = true;
          }
        } else {
          await browser.storage.local.remove(key);
        }
      }
    } catch (e) {}
  }

  async function savePlaybackPosition() {
    if (!state.settings.persistentPlaybackPosition || !state.player) return;
    const key = getPlaybackPositionKey();
    if (!key) return;
    try {
      const position = state.player.getPosition();
      const duration = state.player.getDuration();
      if (position < 10 || (duration && position > duration - 30)) return;
      await browser.storage.local.set({ [key]: { position, timestamp: Date.now() } });
    } catch (e) {}
  }

  function setupPlaybackPositionMemory() {
    if (!state.settings.persistentPlaybackPosition || !state.player) return;
    const waitForDuration = () => {
      if (state.player.getDuration() > 0) loadPlaybackPosition();
      else setTimeout(waitForDuration, 500);
    };
    setTimeout(waitForDuration, 1000);
    let lastSavedPosition = 0;
    setInterval(() => {
      const currentPosition = state.player.getPosition();
      if (Math.abs(currentPosition - lastSavedPosition) >= 5) {
        savePlaybackPosition();
        lastSavedPosition = currentPosition;
      }
    }, 5000);
  }

  async function clearPlaybackPosition() {
    const key = getPlaybackPositionKey();
    if (key) await browser.storage.local.remove(key).catch(() => {});
  }

  // Create UI
  function createUI() {
    const existing = document.getElementById('aniskip-container');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.id = 'aniskip-container';
    container.innerHTML = `
      <div id="aniskip-skip-button" class="aniskip-button aniskip-hidden">
        <span class="aniskip-skip-text">Skip</span>
        <span class="aniskip-skip-type"></span>
      </div>
      <div id="aniskip-panel" class="aniskip-hidden">
        <div class="aniskip-panel-header">
          <span class="aniskip-brand"><span class="aniskip-brand-ani">Ani</span><span class="aniskip-brand-world">World</span> <span class="aniskip-brand-ap">AP</span></span>
          <button id="aniskip-close-panel" class="aniskip-icon-btn">×</button>
        </div>
        <div class="aniskip-panel-content">
          <div id="aniskip-status">Initializing...</div>
          <div id="aniskip-anime-info" class="aniskip-hidden">
            <div class="aniskip-info-row"><span class="aniskip-label">Anime:</span><span id="aniskip-anime-name">-</span></div>
            <div class="aniskip-info-row"><span class="aniskip-label">Season:</span><span id="aniskip-season-num">-</span></div>
            <div class="aniskip-info-row"><span class="aniskip-label">Episode:</span><span id="aniskip-episode-num">-</span></div>
            <div class="aniskip-info-row"><span class="aniskip-label">MAL ID:</span><span id="aniskip-mal-id">-</span><button id="aniskip-change-anime" class="aniskip-small-btn">Change</button></div>
          </div>
          <div id="aniskip-segments" class="aniskip-hidden">
            <div class="aniskip-label">Skip Segments:</div>
            <div id="aniskip-segments-list"></div>
          </div>
          <div id="aniskip-search-panel" class="aniskip-hidden">
            <input type="text" id="aniskip-search-input" placeholder="Search anime...">
            <button id="aniskip-search-btn" class="aniskip-btn">Search</button>
            <div id="aniskip-search-results"></div>
          </div>
          <div id="aniskip-submit-panel" class="aniskip-hidden">
            <div class="aniskip-label">Submit Skip Time:</div>
            <div class="aniskip-form-row"><label>Type:</label><select id="aniskip-submit-type"><option value="op">Opening</option><option value="ed">Ending</option><option value="recap">Recap</option></select></div>
            <div class="aniskip-form-row"><label>Start:</label><input type="text" id="aniskip-submit-start" placeholder="0:00"><button id="aniskip-set-start" class="aniskip-small-btn">Set</button></div>
            <div class="aniskip-form-row"><label>End:</label><input type="text" id="aniskip-submit-end" placeholder="1:30"><button id="aniskip-set-end" class="aniskip-small-btn">Set</button></div>
            <button id="aniskip-submit-btn" class="aniskip-btn">Submit</button>
          </div>
        </div>
        <div class="aniskip-panel-footer">
          <button id="aniskip-toggle-submit" class="aniskip-footer-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Submit</button>
          <button id="aniskip-refresh" class="aniskip-footer-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Refresh</button>
        </div>
      </div>
      <button id="aniskip-toggle-btn" class="aniskip-toggle-btn" title="AniSkip">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5V19L11 12L4 5ZM13 5V19L20 12L13 5Z"/></svg>
      </button>
    `;
    
    // Try to append to JWPlayer container first (for fullscreen support), fallback to body
    const jwContainer = document.querySelector('.jw-wrapper') || document.querySelector('.jwplayer');
    if (jwContainer) {
      jwContainer.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
    
    state.ui.container = container;
    state.ui.skipButton = container.querySelector('#aniskip-skip-button');
    state.ui.panel = container.querySelector('#aniskip-panel');
    
    // Watch for fullscreen changes and move UI accordingly
    function handleFullscreenChange() {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      if (fullscreenElement) {
        // Move UI into fullscreen element
        if (!fullscreenElement.contains(container)) {
          fullscreenElement.appendChild(container);
        }
      } else {
        // Move UI back to JWPlayer container or body
        const jwContainer = document.querySelector('.jw-wrapper') || document.querySelector('.jwplayer');
        if (jwContainer && !jwContainer.contains(container)) {
          jwContainer.appendChild(container);
        } else if (!document.body.contains(container)) {
          document.body.appendChild(container);
        }
      }
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    function syncWithPlayerControls() {
      const toggleBtn = container.querySelector('#aniskip-toggle-btn');
      const skipBtn = state.ui.skipButton;
      const playerContainer = document.querySelector('.jw-wrapper, .jwplayer');
      const controlsHidden = playerContainer && playerContainer.classList.contains('jw-flag-user-inactive');
      const controlbar = document.querySelector('.jw-controlbar');
      const controlbarHidden = controlbar && window.getComputedStyle(controlbar).opacity === '0';
      const shouldHide = controlsHidden || controlbarHidden;
      
      if (!state.ui.panel.classList.contains('aniskip-hidden')) {
        toggleBtn.classList.remove('aniskip-controls-hidden');
        skipBtn.classList.remove('aniskip-controls-hidden');
        return;
      }
      
      if (shouldHide) {
        toggleBtn.classList.add('aniskip-controls-hidden');
        skipBtn.classList.add('aniskip-controls-hidden');
      } else {
        toggleBtn.classList.remove('aniskip-controls-hidden');
        skipBtn.classList.remove('aniskip-controls-hidden');
      }
    }
    
    setInterval(syncWithPlayerControls, 200);
    document.addEventListener('mousemove', syncWithPlayerControls);
    
    container.querySelector('#aniskip-toggle-btn').addEventListener('click', () => state.ui.panel.classList.toggle('aniskip-hidden'));
    container.querySelector('#aniskip-close-panel').addEventListener('click', () => state.ui.panel.classList.add('aniskip-hidden'));
    container.querySelector('#aniskip-skip-button').addEventListener('click', skipCurrent);
    container.querySelector('#aniskip-change-anime').addEventListener('click', () => document.querySelector('#aniskip-search-panel').classList.toggle('aniskip-hidden'));
    container.querySelector('#aniskip-search-btn').addEventListener('click', searchAnime);
    container.querySelector('#aniskip-search-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') searchAnime(); });
    
    // Prevent keyboard events on input fields from bubbling to the video player
    // JWPlayer uses number keys (1-9) to seek to percentages, which interferes with typing
    const stopKeyboardPropagation = (e) => {
      e.stopPropagation();
    };
    
    container.querySelectorAll('input[type="text"], select').forEach(input => {
      input.addEventListener('keydown', stopKeyboardPropagation);
      input.addEventListener('keyup', stopKeyboardPropagation);
      input.addEventListener('keypress', stopKeyboardPropagation);
    });
    container.querySelector('#aniskip-toggle-submit').addEventListener('click', () => {
      const submitPanel = document.querySelector('#aniskip-submit-panel');
      const toggleBtn = container.querySelector('#aniskip-toggle-submit');
      const isHidden = submitPanel.classList.contains('aniskip-hidden');
      submitPanel.classList.toggle('aniskip-hidden');
      
      // Update button text and style
      if (isHidden) {
        toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Cancel';
        toggleBtn.classList.add('aniskip-toggle-active');
        setTimeout(() => {
          submitPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      } else {
        toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Submit';
        toggleBtn.classList.remove('aniskip-toggle-active');
      }
    });
    container.querySelector('#aniskip-set-start').addEventListener('click', () => setTimeFromPlayer('start'));
    container.querySelector('#aniskip-set-end').addEventListener('click', () => setTimeFromPlayer('end'));
    container.querySelector('#aniskip-submit-btn').addEventListener('click', submitSkipTime);
    container.querySelector('#aniskip-refresh').addEventListener('click', refreshSkipTimes);
    
    return container;
  }

  function updateStatus(message, isError = false) {
    const statusEl = document.querySelector('#aniskip-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = isError ? 'aniskip-error' : '';
    }
    console.log('VOE AniSkip:', message);
  }

  async function searchAnime() {
    const input = document.querySelector('#aniskip-search-input');
    const query = input.value.trim();
    if (!query) return;
    
    const resultsEl = document.querySelector('#aniskip-search-results');
    resultsEl.innerHTML = '<div class="aniskip-loading">Searching...</div>';
    
    try {
      const results = await browser.runtime.sendMessage({ action: 'searchAnime', query });
      if (!results || results.length === 0) {
        resultsEl.innerHTML = '<div class="aniskip-no-results">No results found</div>';
        return;
      }
      
      resultsEl.innerHTML = results.slice(0, 5).map(anime => `
        <div class="aniskip-search-result" data-mal-id="${anime.mal_id}" data-title="${escapeHtml(anime.title)}">
          <img src="${anime.images?.jpg?.small_image_url || ''}" alt="">
          <div class="aniskip-result-info">
            <div class="aniskip-result-title">${escapeHtml(anime.title)}</div>
            <div class="aniskip-result-meta">${anime.type || ''} • ${anime.episodes || '?'} eps</div>
          </div>
        </div>
      `).join('');
      
      resultsEl.querySelectorAll('.aniskip-search-result').forEach(el => {
        el.addEventListener('click', () => selectAnime(parseInt(el.dataset.malId), el.dataset.title));
      });
    } catch (error) {
      resultsEl.innerHTML = '<div class="aniskip-error">Search failed</div>';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function selectAnime(malId, title) {
    state.currentMalId = malId;
    document.querySelector('#aniskip-anime-name').textContent = title;
    document.querySelector('#aniskip-mal-id').textContent = malId;
    document.querySelector('#aniskip-search-panel').classList.add('aniskip-hidden');
    document.querySelector('#aniskip-anime-info').classList.remove('aniskip-hidden');
    
    const animeInfo = parseAnimeInfo();
    if (animeInfo) {
      await browser.runtime.sendMessage({
        action: 'setAnimeCache',
        cache: { [animeInfo.animeName.toLowerCase()]: { malId, title } }
      });
    }
    await fetchSkipTimes();
  }

  async function fetchSkipTimes() {
    if (!state.currentMalId || !state.currentEpisode) {
      updateStatus('Missing anime info');
      return;
    }
    
    updateStatus('Fetching skip times...');
    
    try {
      const response = await browser.runtime.sendMessage({
        action: 'getSkipTimes',
        malId: state.currentMalId,
        episodeNumber: state.currentEpisode,
        episodeLength: state.player?.getDuration() || 0
      });
      
      if (response.error) {
        updateStatus(`Error: ${response.error}`, true);
        return;
      }
      
      if (!response.found || !response.results || response.results.length === 0) {
        updateStatus('No skip times found for this episode');
        state.skipTimes = [];
      } else {
        state.skipTimes = response.results;
        updateStatus(`Found ${state.skipTimes.length} skip segment(s)`);
        renderSegments();
        addProgressBarMarkers();
      }
    } catch (error) {
      updateStatus('Failed to fetch skip times', true);
    }
  }

  function renderSegments() {
    const segmentsEl = document.querySelector('#aniskip-segments');
    const listEl = document.querySelector('#aniskip-segments-list');
    
    if (state.skipTimes.length === 0) {
      segmentsEl.classList.add('aniskip-hidden');
      return;
    }
    
    segmentsEl.classList.remove('aniskip-hidden');
    listEl.innerHTML = state.skipTimes.map(segment => {
      const label = SKIP_TYPE_LABELS[segment.skipType] || segment.skipType;
      return `
        <div class="aniskip-segment" data-skip-id="${segment.skipId}">
          <span class="aniskip-segment-type">${label}</span>
          <span class="aniskip-segment-time">${formatTime(segment.interval.startTime)} - ${formatTime(segment.interval.endTime)}</span>
          <div class="aniskip-vote-btns">
            <button class="aniskip-vote-btn aniskip-upvote" data-vote="upvote" title="Upvote">👍</button>
            <button class="aniskip-vote-btn aniskip-downvote" data-vote="downvote" title="Downvote">👎</button>
          </div>
        </div>
      `;
    }).join('');
    
    listEl.querySelectorAll('.aniskip-vote-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const segment = e.target.closest('.aniskip-segment');
        try {
          await browser.runtime.sendMessage({ action: 'voteSkipTime', skipId: segment.dataset.skipId, voteType: e.target.dataset.vote });
          e.target.classList.add('aniskip-voted');
        } catch (error) {}
      });
    });
  }

  // Helper function to convert hex color to rgba
  function hexToRgba(hex, opacity) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return `rgba(255, 0, 251, ${opacity})`; // Default fallback
  }

  // Add CUSTOMIZABLE markers to progress bar
  function addProgressBarMarkers() {
    document.querySelectorAll('.aniskip-marker').forEach(el => el.remove());
    if (!state.player || state.skipTimes.length === 0) return;
    
    const duration = state.player.getDuration();
    if (!duration) return;
    
    const progressBar = document.querySelector('.jw-slider-time .jw-slider-container') || 
                        document.querySelector('.jw-slider-time') || 
                        document.querySelector('.jw-progress');
    if (!progressBar) {
      console.log('VOE AniSkip: Progress bar not found');
      return;
    }

    // Ensure relative positioning
    const computedStyle = window.getComputedStyle(progressBar);
    if (computedStyle.position === 'static') {
      progressBar.style.position = 'relative';
    }

    // Get colors from settings
    const opacity = state.settings.markerOpacity || 0.5;
    const colorOp = hexToRgba(state.settings.markerColorOp || '#ff00fb', opacity);
    const colorEd = hexToRgba(state.settings.markerColorEd || '#ff00fb', opacity);
    const colorRecap = hexToRgba(state.settings.markerColorRecap || '#ffdd00', opacity);
    
    state.skipTimes.forEach(segment => {
      const startPercent = (segment.interval.startTime / duration) * 100;
      const width = ((segment.interval.endTime - segment.interval.startTime) / duration) * 100;
      
      // Determine color based on skip type
      let bgColor;
      if (segment.skipType === 'op' || segment.skipType === 'mixed-op') {
        bgColor = colorOp;
      } else if (segment.skipType === 'ed' || segment.skipType === 'mixed-ed') {
        bgColor = colorEd;
      } else if (segment.skipType === 'recap') {
        bgColor = colorRecap;
      } else {
        bgColor = colorOp; // Default
      }
      
      const marker = document.createElement('div');
      marker.className = `aniskip-marker aniskip-marker-${segment.skipType}`;
      marker.style.cssText = `
        position: absolute;
        left: ${startPercent}%;
        width: ${width}%;
        top: 30%;
        height: 40%;
        pointer-events: none;
        z-index: 100;
        border-radius: 2px;
        background-color: ${bgColor};
      `;
      marker.title = `${SKIP_TYPE_LABELS[segment.skipType]}: ${formatTime(segment.interval.startTime)} - ${formatTime(segment.interval.endTime)}`;
      progressBar.appendChild(marker);
    });
  }

  function checkSkipSegments() {
    if (!state.player || state.skipTimes.length === 0) return;
    
    const currentTime = state.player.getPosition();
    
    for (const segment of state.skipTimes) {
      const { startTime, endTime } = segment.interval;
      const segmentId = segment.skipId;
      
      if (currentTime >= startTime && currentTime < endTime - 1) {
        const shouldAutoSkip = (
          (segment.skipType === 'op' || segment.skipType === 'mixed-op') && state.settings.autoSkipOp ||
          (segment.skipType === 'ed' || segment.skipType === 'mixed-ed') && state.settings.autoSkipEd ||
          segment.skipType === 'recap' && state.settings.autoSkipRecap
        );
        
        if (shouldAutoSkip && !state.skippedSegments.has(segmentId)) {
          state.skippedSegments.add(segmentId);
          
          // Skip to end of segment
          state.player.seek(endTime + state.settings.skipOffset);
          
          // If it's an ending, mark episode as seen
          if (segment.skipType === 'ed' || segment.skipType === 'mixed-ed') {
            console.log('VOE AniSkip: Auto-skipped ending, marking as seen');
            clearPlaybackPosition();
            markCurrentEpisodeAsSeen();
          }
          
          // AUTO-PRESS PLAY AFTER SKIP
          if (state.settings.playAfterSkip) {
            setTimeout(() => {
              try {
                const video = document.querySelector('video');
                if (video) {
                  video.play().catch(() => {});
                } else if (state.player && state.player.play) {
                  state.player.play();
                }
              } catch (e) {
                console.log('VOE AniSkip: Could not auto-play after skip');
              }
            }, 150);
          }
          
          state.ui.skipButton.classList.add('aniskip-hidden');
          return;
        }
        
        if (state.settings.showButtons && !state.skippedSegments.has(segmentId)) {
          showSkipButton(segment);
          return;
        }
      }
    }
    
    state.ui.skipButton.classList.add('aniskip-hidden');
  }

  function showSkipButton(segment) {
    const skipButton = state.ui.skipButton;
    skipButton.querySelector('.aniskip-skip-type').textContent = SKIP_TYPE_LABELS[segment.skipType] || segment.skipType;
    skipButton.dataset.endTime = segment.interval.endTime;
    skipButton.dataset.skipId = segment.skipId;
    skipButton.dataset.skipType = segment.skipType;
    skipButton.classList.remove('aniskip-hidden');
  }

  function skipCurrent() {
    const skipButton = state.ui.skipButton;
    const endTime = parseFloat(skipButton.dataset.endTime);
    const skipId = skipButton.dataset.skipId;
    const skipType = skipButton.dataset.skipType;
    
    if (endTime && state.player) {
      state.skippedSegments.add(skipId);
      
      // Skip to end of segment
      state.player.seek(endTime + state.settings.skipOffset);
      
      // If it's an ending, mark episode as seen
      if (skipType === 'ed' || skipType === 'mixed-ed') {
        clearPlaybackPosition();
        markCurrentEpisodeAsSeen();
      }
      
      // AUTO-PRESS PLAY AFTER SKIP
      if (state.settings.playAfterSkip) {
        setTimeout(() => {
          try {
            const video = document.querySelector('video');
            if (video) {
              video.play().catch(() => {});
            } else if (state.player && state.player.play) {
              state.player.play();
            }
          } catch (e) {
            console.log('VOE AniSkip: Could not auto-play after skip');
          }
        }, 150);
      }
      
      skipButton.classList.add('aniskip-hidden');
      console.log('VOE AniSkip: Skipped to', endTime);
    }
  }

  // Track if we've already marked as seen to prevent duplicates
  let markedAsSeen = false;

  // Mark the current episode as seen (send message to parent AniWorld page)
  function markCurrentEpisodeAsSeen() {
    if (markedAsSeen) return;
    markedAsSeen = true;
    
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'ANISKIP_MARK_SEEN' }, '*');
      console.log('VOE AniSkip: Sent mark as seen request to parent');
    }
  }

  function requestNextEpisode() {
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'ANISKIP_NEXT_EPISODE' }, '*');
    }
  }

  function requestFullscreen() {
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'ANISKIP_REQUEST_FULLSCREEN' }, '*');
    }
  }

  function handleAutoPlay() {
    console.log('VOE AniSkip: Received auto-play request');
    let attempts = 0;
    const maxAttempts = 40;
    
    const findAndClickPlay = () => {
      attempts++;
      console.log('VOE AniSkip: Auto-play attempt', attempts);
      
      // Try clicking the VOE spin/play button overlay
      const spinButton = document.querySelector('div.spin');
      if (spinButton) {
        console.log('VOE AniSkip: Found spin button, clicking');
        spinButton.click();
        return;
      }
      
      // Try clicking VOE logo/icon overlay
      const voeIcon = document.querySelector('img.icon[src*="voe"]') || document.querySelector('img.icon');
      if (voeIcon) {
        console.log('VOE AniSkip: Found VOE icon, clicking');
        (voeIcon.parentElement || voeIcon).click();
        return;
      }
      
      // Try clicking JWPlayer play button
      const jwPlayButton = document.querySelector('.jw-display-icon-display .jw-icon-display') ||
                           document.querySelector('.jw-display-icon-container') ||
                           document.querySelector('.jw-icon-playback');
      if (jwPlayButton) {
        console.log('VOE AniSkip: Found JW play button, clicking');
        jwPlayButton.click();
        return;
      }
      
      // Try clicking any large centered play button
      const playOverlay = document.querySelector('[class*="play"]') ||
                          document.querySelector('[class*="Play"]');
      if (playOverlay && playOverlay.offsetWidth > 50) {
        console.log('VOE AniSkip: Found play overlay, clicking');
        playOverlay.click();
        return;
      }
      
      // Try directly playing the video element
      const video = document.querySelector('video');
      if (video) {
        console.log('VOE AniSkip: Found video element, playing directly');
        video.play().catch(e => console.log('VOE AniSkip: Direct play failed', e));
        return;
      }
      
      if (attempts < maxAttempts) setTimeout(findAndClickPlay, 300);
    };
    
    findAndClickPlay();
  }

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'ANISKIP_AUTO_PLAY') handleAutoPlay();
    if (event.data?.type === 'ANISKIP_ENTER_FULLSCREEN') enterFullscreenFromPlayer();
  });

  // Enter fullscreen using JWPlayer or native video
  function enterFullscreenFromPlayer() {
    console.log('VOE AniSkip: Entering fullscreen from player');
    
    // Try JWPlayer fullscreen
    if (state.player && state.player.setFullscreen) {
      state.player.setFullscreen(true);
      return;
    }
    
    // Try clicking JWPlayer fullscreen button
    const jwFullscreenBtn = document.querySelector('.jw-icon-fullscreen');
    if (jwFullscreenBtn) {
      jwFullscreenBtn.click();
      return;
    }
    
    // Try native fullscreen on video container
    const container = document.querySelector('.jw-wrapper') || 
                      document.querySelector('.jwplayer') ||
                      document.querySelector('video')?.parentElement;
    if (container) {
      const requestFS = container.requestFullscreen || container.webkitRequestFullscreen;
      if (requestFS) {
        requestFS.call(container).catch(e => console.log('VOE AniSkip: Fullscreen failed', e));
      }
    }
  }

  async function checkShouldAutoPlay() {
    try {
      const result = await browser.storage.local.get(['shouldAutoPlay', 'autoPlayTimestamp']);
      console.log('VOE AniSkip: Checking auto-play flag:', result);
      if (result.shouldAutoPlay && (Date.now() - result.autoPlayTimestamp < 30000)) {
        console.log('VOE AniSkip: Auto-play flag found, will auto-play');
        await browser.storage.local.remove(['shouldAutoPlay', 'autoPlayTimestamp']);
        // Wait longer for the player to be ready
        setTimeout(handleAutoPlay, 2000);
      }
    } catch (e) {
      console.log('VOE AniSkip: Error checking auto-play:', e);
    }
  }

  function setTimeFromPlayer(field) {
    if (!state.player) return;
    const inputId = field === 'start' ? '#aniskip-submit-start' : '#aniskip-submit-end';
    document.querySelector(inputId).value = formatTime(state.player.getPosition());
  }

  async function submitSkipTime() {
    if (!state.currentMalId || !state.currentEpisode || !state.player) {
      updateStatus('Cannot submit: missing anime info', true);
      return;
    }
    
    const type = document.querySelector('#aniskip-submit-type').value;
    const startTime = parseTime(document.querySelector('#aniskip-submit-start').value);
    const endTime = parseTime(document.querySelector('#aniskip-submit-end').value);
    
    if (startTime === null || endTime === null) { updateStatus('Invalid time format', true); return; }
    if (startTime >= endTime) { updateStatus('Start time must be before end time', true); return; }
    
    updateStatus('Submitting skip time...');
    
    try {
      const response = await browser.runtime.sendMessage({
        action: 'createSkipTime',
        malId: state.currentMalId,
        episodeNumber: state.currentEpisode,
        data: { skipType: type, startTime: Math.round(startTime * 1000) / 1000, endTime: Math.round(endTime * 1000) / 1000, episodeLength: Math.round(state.player.getDuration() * 1000) / 1000 }
      });
      
      if (response.error) updateStatus(`Submit failed: ${response.error}`, true);
      else {
        updateStatus('Skip time submitted successfully!');
        document.querySelector('#aniskip-submit-panel').classList.add('aniskip-hidden');
        await fetchSkipTimes();
      }
    } catch (error) { updateStatus('Failed to submit skip time', true); }
  }

  async function refreshSkipTimes() {
    state.skippedSegments.clear();
    await fetchSkipTimes();
  }

  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function parseTime(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(p => parseFloat(p.trim()));
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return null;
  }

  // Initialize
  async function init() {
    if (state.initialized) return;
    state.initialized = true;
    
    console.log('VOE AniSkip: Initializing...');
    
    // Check for auto-play flag early
    checkShouldAutoPlay();
    
    try {
      state.settings = await browser.runtime.sendMessage({ action: 'getSettings' });
      console.log('VOE AniSkip: Settings loaded', state.settings);
    } catch (error) {
      console.error('VOE AniSkip: Failed to load settings:', error);
    }
    
    createUI();
    updateStatus('Waiting for video player...');
    
    try {
      state.player = await waitForPlayer();
      console.log('VOE AniSkip: Player ready');
      updateStatus('Player found, parsing anime info...');
      
      let animeInfo = null;
      if (isInIframe()) animeInfo = await getAniWorldInfo();
      if (!animeInfo) animeInfo = parseAnimeInfo();
      
      if (animeInfo) {
        state.currentEpisode = animeInfo.episode;
        state.currentSeason = animeInfo.season || 1;
        state.currentVideoId = generateVideoId(animeInfo);
        
        document.querySelector('#aniskip-episode-num').textContent = animeInfo.episode;
        document.querySelector('#aniskip-season-num').textContent = animeInfo.season || 1;
        document.querySelector('#aniskip-anime-info').classList.remove('aniskip-hidden');
        
        const cache = await browser.runtime.sendMessage({ action: 'getAnimeCache' });
        const cached = cache[animeInfo.animeName.toLowerCase()];
        
        if (cached) {
          state.currentMalId = cached.malId;
          document.querySelector('#aniskip-anime-name').textContent = cached.title;
          document.querySelector('#aniskip-mal-id').textContent = cached.malId;
          updateStatus('Using cached anime info');
          await fetchSkipTimes();
        } else {
          document.querySelector('#aniskip-anime-name').textContent = animeInfo.animeName;
          document.querySelector('#aniskip-search-input').value = animeInfo.animeName;
          updateStatus('Searching for anime: ' + animeInfo.animeName);
          
          let searchQuery = animeInfo.animeName;
          if (animeInfo.season && animeInfo.season > 1) searchQuery += ' season ' + animeInfo.season;
          
          const results = await browser.runtime.sendMessage({ action: 'searchAnime', query: searchQuery });
          
          if (results && results.length > 0) {
            await selectAnime(results[0].mal_id, results[0].title);
          } else {
            updateStatus('Anime not found. Click "Change" to search manually.');
            document.querySelector('#aniskip-search-panel').classList.remove('aniskip-hidden');
          }
        }
      } else {
        updateStatus('Could not parse anime info from title');
        document.querySelector('#aniskip-search-panel').classList.remove('aniskip-hidden');
      }
      
      state.player.on('time', checkSkipSegments);
      
      // Check if we're near the end of the video to trigger next episode early
      state.player.on('time', () => {
        const duration = state.player.getDuration();
        const position = state.player.getPosition();
        const timeRemaining = duration - position;
        
        // If less than 1 second remaining and we haven't already triggered, go to next episode
        if (duration > 0 && timeRemaining > 0 && timeRemaining < 1 && !markedAsSeen) {
          console.log('VOE AniSkip: Near end of video, skipping to next episode');
          clearPlaybackPosition();
          markCurrentEpisodeAsSeen();
        }
      });
      
      state.player.on('complete', () => {
        console.log('VOE AniSkip: Video ended');
        clearPlaybackPosition();
        markCurrentEpisodeAsSeen();
      });
      
      const video = document.querySelector('video');
      if (video) {
        video.addEventListener('ended', () => {
          console.log('VOE AniSkip: Video ended (native)');
          clearPlaybackPosition();
          markCurrentEpisodeAsSeen();
        });
      }
      
      state.player.on('meta', () => setTimeout(addProgressBarMarkers, 500));
      setTimeout(addProgressBarMarkers, 2000);
      
      // Set up persistent features
      setupPersistentVolume();
      setupPlaybackPositionMemory();
      checkShouldAutoPlay();
      
    } catch (error) {
      console.error('VOE AniSkip: Failed to initialize:', error);
      updateStatus('Failed to find video player: ' + error.message, true);
    }
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'settingsUpdated') {
      state.settings = message.settings;
      console.log('VOE AniSkip: Settings updated', state.settings);
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'ANISKIP_ANIME_INFO') {
      browser.storage.local.set({ aniWorldInfo: { ...event.data.data, timestamp: Date.now() } });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  } else {
    setTimeout(init, 500);
  }

  } // End of runExtension

  waitForVOE(runExtension);

})();
