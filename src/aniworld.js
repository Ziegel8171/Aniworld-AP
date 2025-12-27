// AniWorld Content Script
// Extracts anime info from AniWorld page and communicates with VOE iframe
// Enhanced with persistent language memory

(function() {
  'use strict';

  console.log('VOE AniSkip: AniWorld script loaded');

  // ============================================================
  // Persistent Language Memory
  // ============================================================
  async function saveSelectedLanguage(langKey) {
    try {
      await browser.storage.local.set({ preferredLanguage: langKey });
      console.log('VOE AniSkip: Saved preferred language:', langKey);
    } catch (e) {
      console.error('VOE AniSkip: Error saving language:', e);
    }
  }

  async function loadPreferredLanguage() {
    try {
      const result = await browser.storage.local.get('preferredLanguage');
      return result.preferredLanguage || null;
    } catch (e) {
      return null;
    }
  }

  async function applyPreferredLanguage() {
    const preferredLang = await loadPreferredLanguage();
    if (!preferredLang) return;

    // Find and click the preferred language button
    const langButtons = document.querySelectorAll('.changemark.changemark-active, .changemark');
    for (const btn of langButtons) {
      const langKey = btn.closest('[data-lang-key]')?.dataset.langKey;
      if (langKey === preferredLang) {
        // Check if it's not already selected
        const currentActive = document.querySelector('.changemark.changemark-active');
        const currentLangKey = currentActive?.closest('[data-lang-key]')?.dataset.langKey;
        
        if (currentLangKey !== preferredLang) {
          console.log('VOE AniSkip: Applying preferred language:', preferredLang);
          btn.click();
        }
        break;
      }
    }
  }

  // Monitor language changes
  function setupLanguageObserver() {
    // Observe clicks on language buttons
    document.addEventListener('click', async (e) => {
      const langContainer = e.target.closest('[data-lang-key]');
      if (langContainer) {
        const langKey = langContainer.dataset.langKey;
        if (langKey) {
          await saveSelectedLanguage(langKey);
        }
      }
    });

    // Apply preferred language on page load
    setTimeout(applyPreferredLanguage, 1000);
  }

  // Remove any AniSkip UI elements from the main AniWorld page
  // (they should only appear inside the VOE iframe)
  function removeAniSkipUI() {
    const elements = document.querySelectorAll('#aniskip-container, .aniskip-toggle-btn, .aniskip-button');
    elements.forEach(el => el.remove());
    return elements.length > 0;
  }

  // Try to remove every second until found
  const removalInterval = setInterval(() => {
    if (removeAniSkipUI()) {
      console.log('VOE AniSkip: Removed UI from AniWorld main page');
      clearInterval(removalInterval);
    }
  }, 1000);

  // Also try immediately
  removeAniSkipUI();

  // Get next episode URL from AniWorld page
  function getNextEpisodeUrl() {
    // Find the currently active episode link
    const activeEpisode = document.querySelector('a.active[data-episode-id]');
    
    if (activeEpisode) {
      // Get the next sibling li's link
      const currentLi = activeEpisode.closest('li');
      if (currentLi) {
        const nextLi = currentLi.nextElementSibling;
        if (nextLi) {
          const nextLink = nextLi.querySelector('a[data-episode-id]');
          if (nextLink) {
            console.log('VOE AniSkip: Found next episode link:', nextLink.href);
            return { url: nextLink.href, isNextSeason: false };
          }
        }
      }
    }
    
    // No next episode in current season - check for next season
    const nextSeasonUrl = getNextSeasonFirstEpisodeUrl();
    if (nextSeasonUrl) {
      console.log('VOE AniSkip: Found next season first episode:', nextSeasonUrl);
      return { url: nextSeasonUrl, isNextSeason: true };
    }
    
    return null;
  }
  
  // Get the first episode URL of the next season
  function getNextSeasonFirstEpisodeUrl() {
    // Find seasons navigation - look for the list containing season links
    const seasonsContainer = document.querySelector('.hosterSiteDirectNav ul');
    if (!seasonsContainer) return null;
    
    // Find the active season
    const activeSeason = seasonsContainer.querySelector('a.active[href*="staffel"]');
    if (!activeSeason) return null;
    
    const currentSeasonLi = activeSeason.closest('li');
    if (!currentSeasonLi) return null;
    
    const nextSeasonLi = currentSeasonLi.nextElementSibling;
    if (!nextSeasonLi) return null;
    
    const nextSeasonLink = nextSeasonLi.querySelector('a[href*="staffel"]');
    if (!nextSeasonLink) return null;
    
    // Don't skip from season to "filme" (movies)
    if (nextSeasonLink.href.includes('/filme')) return null;
    
    // Return the season URL - we'll need to fetch it to get episode 1
    return nextSeasonLink.href;
  }
  
  // Check if there is a next episode available
  function hasNextEpisode() {
    const activeEpisode = document.querySelector('a.active[data-episode-id]');
    if (activeEpisode) {
      const currentLi = activeEpisode.closest('li');
      if (currentLi) {
        const nextLi = currentLi.nextElementSibling;
        if (nextLi && nextLi.querySelector('a[data-episode-id]')) {
          return true;
        }
      }
    }
    // Also check for next season
    return !!getNextSeasonFirstEpisodeUrl();
  }

  // Navigate to next episode
  async function goToNextEpisode() {
    const nextInfo = getNextEpisodeUrl();
    if (!nextInfo) {
      console.log('VOE AniSkip: No next episode or season found');
      return;
    }
    
    let nextUrl = nextInfo.url;
    
    // If it's a next season, we need to fetch the season page first to get episode 1
    if (nextInfo.isNextSeason) {
      try {
        console.log('VOE AniSkip: Fetching next season page:', nextUrl);
        const seasonResponse = await fetch(nextUrl);
        const seasonHtml = await seasonResponse.text();
        const seasonDom = new DOMParser().parseFromString(seasonHtml, 'text/html');
        
        // Find the first episode link in the next season
        const firstEpisodeLink = seasonDom.querySelector('a[data-episode-id]');
        if (firstEpisodeLink) {
          nextUrl = firstEpisodeLink.href;
          // Make sure it's an absolute URL
          if (!nextUrl.startsWith('http')) {
            nextUrl = window.location.origin + nextUrl;
          }
          console.log('VOE AniSkip: Found first episode of next season:', nextUrl);
        } else {
          console.log('VOE AniSkip: Could not find first episode in next season');
          return;
        }
      } catch (error) {
        console.error('VOE AniSkip: Error fetching next season:', error);
        return;
      }
    }
    
    console.log('VOE AniSkip: Navigating to next episode:', nextUrl);
    
    // Store flag that we want to auto-play
    await browser.storage.local.set({ 
      autoPlayNext: true,
      timestamp: Date.now()
    });
    
    // Navigate to next episode (full page reload)
    window.location.href = nextUrl;
  }

  // Track if we're already navigating to prevent duplicates
  let isNavigating = false;

  // Listen for messages from the VOE iframe
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ANISKIP_NEXT_EPISODE') {
      console.log('VOE AniSkip: Received next episode request from iframe');
      if (!isNavigating) {
        isNavigating = true;
        goToNextEpisode().finally(() => {
          setTimeout(() => { isNavigating = false; }, 2000);
        });
      }
    }
    
    if (event.data && event.data.type === 'ANISKIP_REQUEST_FULLSCREEN') {
      console.log('VOE AniSkip: Received fullscreen request from iframe');
      enterFullscreen();
    }
    
    if (event.data && event.data.type === 'ANISKIP_MARK_SEEN') {
      console.log('VOE AniSkip: Received mark as seen request from iframe');
      markCurrentEpisodeAsSeen();
      if (!isNavigating) {
        isNavigating = true;
        goToNextEpisode().finally(() => {
          setTimeout(() => { isNavigating = false; }, 2000);
        });
      }
    }
  });

  // Mark the current episode as seen (add 'seen' class)
  function markCurrentEpisodeAsSeen() {
    const activeEpisode = document.querySelector('a.active[data-episode-id]');
    if (activeEpisode) {
      activeEpisode.classList.add('seen');
      console.log('VOE AniSkip: Marked episode as seen:', activeEpisode.getAttribute('data-episode-id'));
      activeEpisode.classList.remove('aniskip-in-progress');
    }
  }

  // Enter fullscreen on the video container
  function enterFullscreen() {
    // Send message to iframe to enter fullscreen using JWPlayer
    const iframe = document.querySelector('iframe[src*="voe"]') || 
                   document.querySelector('.inSiteWebStream iframe') ||
                   document.querySelector('iframe');
    if (iframe) {
      iframe.contentWindow.postMessage({ type: 'ANISKIP_ENTER_FULLSCREEN' }, '*');
    }
  }

  // Check if we should auto-play (came from previous episode)
  async function checkAutoPlay() {
    try {
      const result = await browser.storage.local.get(['autoPlayNext', 'timestamp']);
      if (result.autoPlayNext && (Date.now() - result.timestamp < 30000)) {
        console.log('VOE AniSkip: Auto-play enabled from previous episode');
        
        // Clear the flags
        await browser.storage.local.remove(['autoPlayNext', 'timestamp']);
        
        // Store flag for the iframe to know it should auto-play
        await browser.storage.local.set({ 
          shouldAutoPlay: true,
          autoPlayTimestamp: Date.now()
        });
        
        // Wait for iframe to load and click play
        waitForPlayerAndPlay();
      }
    } catch (e) {
      console.error('VOE AniSkip: Error checking auto-play:', e);
    }
  }

  // Wait for the VOE player iframe to load and trigger play
  function waitForPlayerAndPlay() {
    let attempts = 0;
    const maxAttempts = 30;
    
    const check = () => {
      attempts++;
      
      // Find the iframe
      const iframe = document.querySelector('iframe[src*="voe"]') || 
                     document.querySelector('.inSiteWebStream iframe') ||
                     document.querySelector('iframe');
      if (iframe) {
        console.log('VOE AniSkip: Found player iframe, sending auto-play message');
        
        // Send message to iframe to auto-play
        setTimeout(() => {
          iframe.contentWindow.postMessage({ type: 'ANISKIP_AUTO_PLAY' }, '*');
        }, 1500);
        
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(check, 500);
      }
    };
    
    check();
  }

  // Parse anime info from AniWorld page
  function parseAniWorldInfo() {
    // Try to get info from breadcrumb
    // Format: Home > Animes > Anime Name > Staffel X > Episode Y
    const breadcrumbs = document.querySelectorAll('.breadCrumbMenu li');
    
    let animeName = null;
    let season = 1;
    let episode = null;
    
    breadcrumbs.forEach((li, index) => {
      const text = li.textContent.trim();
      const link = li.querySelector('a');
      
      // Anime name is usually the 3rd breadcrumb (index 2)
      if (index === 2 && link) {
        animeName = link.querySelector('span')?.textContent?.trim() || text;
      }
      
      // Season info - "Staffel X"
      if (text.toLowerCase().includes('staffel')) {
        const match = text.match(/staffel\s*(\d+)/i);
        if (match) {
          season = parseInt(match[1], 10);
        }
      }
      
      // Episode info - "Episode X"
      if (text.toLowerCase().includes('episode')) {
        const match = text.match(/episode\s*(\d+)/i);
        if (match) {
          episode = parseInt(match[1], 10);
        }
      }
    });
    
    // Fallback: try to parse from page title
    // Format: "Episode 11 Staffel 1 von A Gatherer's Adventure in Isekai | AniWorld.to"
    if (!animeName || !episode) {
      const title = document.title;
      const titleMatch = title.match(/Episode\s*(\d+)\s*Staffel\s*(\d+)\s*von\s*(.+?)\s*\|/i);
      if (titleMatch) {
        episode = episode || parseInt(titleMatch[1], 10);
        season = parseInt(titleMatch[2], 10);
        animeName = animeName || titleMatch[3].trim();
      }
    }
    
    // Fallback: try meta tags
    if (!animeName) {
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
      if (ogTitle) {
        const match = ogTitle.match(/Episode\s*(\d+)\s*Staffel\s*(\d+)\s*von\s*(.+)/i);
        if (match) {
          episode = episode || parseInt(match[1], 10);
          season = parseInt(match[2], 10);
          animeName = match[3].trim();
        }
      }
    }
    
    // Try getting anime name from series title element
    if (!animeName) {
      const seriesTitle = document.querySelector('.series-title h1 span');
      if (seriesTitle) {
        animeName = seriesTitle.textContent.trim();
      }
    }
    
    if (animeName && episode) {
      console.log('VOE AniSkip: AniWorld parsed -', { animeName, season, episode });
      return { animeName, season, episode, source: 'aniworld' };
    }
    
    console.log('VOE AniSkip: Could not parse AniWorld info');
    return null;
  }

  // Store the anime info for the iframe to access
  async function storeAnimeInfo() {
    const info = parseAniWorldInfo();
    if (info) {
      try {
        await browser.storage.local.set({ 
          aniWorldInfo: {
            ...info,
            url: window.location.href,
            timestamp: Date.now()
          }
        });
        console.log('VOE AniSkip: Stored AniWorld info', info);
        
        // Also try to send message to any existing VOE iframes
        notifyIframes(info);
      } catch (e) {
        console.error('VOE AniSkip: Failed to store info', e);
      }
    }
  }

  // Try to communicate with VOE iframes via postMessage
  function notifyIframes(info) {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow.postMessage({
          type: 'ANISKIP_ANIME_INFO',
          data: info
        }, '*');
        console.log('VOE AniSkip: Sent info to iframe');
      } catch (e) {
        // Cross-origin, can't access directly
      }
    });
  }

  // Watch for new iframes being added (VOE player loads dynamically)
  function watchForIframes() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'IFRAME') {
            console.log('VOE AniSkip: New iframe detected');
            setTimeout(() => {
              const info = parseAniWorldInfo();
              if (info) {
                try {
                  node.contentWindow.postMessage({
                    type: 'ANISKIP_ANIME_INFO',
                    data: info
                  }, '*');
                } catch (e) {}
              }
            }, 1000);
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Run when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      storeAnimeInfo();
      watchForIframes();
      checkAutoPlay();
      setupLanguageObserver();
    });
  } else {
    storeAnimeInfo();
    watchForIframes();
    checkAutoPlay();
    setupLanguageObserver();
  }

  // Also update when URL changes (for SPA navigation)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(storeAnimeInfo, 500);
    }
  }, 1000);

})();
