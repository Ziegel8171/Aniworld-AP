// Background script for VOE AniSkip
// Handles API requests and dynamic content script injection

const ANISKIP_API = 'https://api.aniskip.com/v2';
const JIKAN_API = 'https://api.jikan.moe/v4';

// Track which frames we've injected into
const injectedFrames = new Set();

// Update toolbar icon based on theme
async function updateToolbarIcon(theme) {
  const iconPath = theme === 'aniworld' ? 'icons/icon-aniworld.svg' : 'icons/icon-classic.svg';
  try {
    await browser.browserAction.setIcon({
      path: {
        48: iconPath,
        96: iconPath
      }
    });
  } catch (error) {
    console.error('Failed to update toolbar icon:', error);
  }
}

// Initialize icon on startup
async function initToolbarIcon() {
  const settings = await browser.storage.local.get({ uiTheme: 'classic' });
  await updateToolbarIcon(settings.uiTheme);
}

// Run on startup
initToolbarIcon();

// Generate a unique user ID for this installation
async function getUserId() {
  const result = await browser.storage.local.get('userId');
  if (result.userId) {
    return result.userId;
  }
  const userId = crypto.randomUUID();
  await browser.storage.local.set({ userId });
  return userId;
}

// Search for anime on MyAnimeList via Jikan API
async function searchAnime(query) {
  try {
    const url = `${JIKAN_API}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching anime:', error);
    return [];
  }
}

// Get skip times from AniSkip API
async function getSkipTimes(malId, episodeNumber, episodeLength) {
  try {
    const types = ['op', 'ed', 'mixed-op', 'mixed-ed', 'recap'].join('&types=');
    const url = `${ANISKIP_API}/skip-times/${malId}/${episodeNumber}?types=${types}&episodeLength=${episodeLength}`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return { found: false, results: [] };
      }
      throw new Error(`AniSkip API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting skip times:', error);
    return { found: false, results: [], error: error.message };
  }
}

// Submit a new skip time
async function createSkipTime(malId, episodeNumber, data) {
  try {
    const userId = await getUserId();
    const url = `${ANISKIP_API}/skip-times/${malId}/${episodeNumber}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        submitterId: userId,
        providerName: 'voe'
      })
    });
    if (!response.ok) {
      throw new Error(`AniSkip API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating skip time:', error);
    return { error: error.message };
  }
}

// Vote on a skip time
async function voteSkipTime(skipId, voteType) {
  try {
    const url = `${ANISKIP_API}/skip-times/vote/${skipId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ voteType })
    });
    if (!response.ok) {
      throw new Error(`AniSkip API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error voting on skip time:', error);
    return { error: error.message };
  }
}

// Inject content script into a frame
async function injectContentScript(tabId, frameId) {
  const frameKey = `${tabId}-${frameId}`;
  if (injectedFrames.has(frameKey)) {
    return;
  }
  
  try {
    // Inject CSS first
    await browser.tabs.insertCSS(tabId, {
      frameId: frameId,
      file: 'src/styles.css'
    });
    
    // Then inject JS
    await browser.tabs.executeScript(tabId, {
      frameId: frameId,
      file: 'src/content.js'
    });
    
    injectedFrames.add(frameKey);
    console.log('VOE AniSkip: Injected content script into frame', frameId);
  } catch (error) {
    console.error('VOE AniSkip: Failed to inject content script:', error);
  }
}

// Listen for iframe navigations from AniWorld
browser.webNavigation.onCompleted.addListener(async (details) => {
  // Only care about subframes (iframes)
  if (details.frameId === 0) return;
  
  // Skip common non-VOE iframes
  const url = details.url.toLowerCase();
  if (url.includes('facebook.com') ||
      url.includes('twitter.com') ||
      url.includes('google.com') ||
      url.includes('youtube.com') ||
      url.includes('ads') ||
      url.includes('analytics') ||
      url.includes('aniworld.to')) {
    return;
  }
  
  // Check if parent is AniWorld
  try {
    const tab = await browser.tabs.get(details.tabId);
    if (!tab.url || !tab.url.includes('aniworld.to')) {
      return;
    }
    
    console.log('VOE AniSkip: Potential VOE iframe detected:', details.url);
    
    // Inject content script into the iframe
    // The content script will check if it's actually a VOE player
    await injectContentScript(details.tabId, details.frameId);
    
  } catch (error) {
    // Tab might have been closed
  }
});

// Clean up injected frames when tab is closed or navigated
browser.tabs.onRemoved.addListener((tabId) => {
  // Remove all frame entries for this tab
  for (const key of injectedFrames) {
    if (key.startsWith(`${tabId}-`)) {
      injectedFrames.delete(key);
    }
  }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    // Clear frame entries when tab navigates
    for (const key of injectedFrames) {
      if (key.startsWith(`${tabId}-`)) {
        injectedFrames.delete(key);
      }
    }
  }
});

// Message handler
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleAsync = async () => {
    switch (message.action) {
      case 'searchAnime':
        return await searchAnime(message.query);
      
      case 'getSkipTimes':
        return await getSkipTimes(message.malId, message.episodeNumber, message.episodeLength);
      
      case 'createSkipTime':
        return await createSkipTime(message.malId, message.episodeNumber, message.data);
      
      case 'voteSkipTime':
        return await voteSkipTime(message.skipId, message.voteType);
      
      case 'getSettings':
        const settings = await browser.storage.local.get({
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
          markerColorEd: '#22C55E',
          markerColorRecap: '#ffdd00',
          markerOpacity: 0.5,
          uiTheme: 'classic'
        });
        return settings;
      
      case 'saveSettings':
        await browser.storage.local.set(message.settings);
        // Update toolbar icon if theme changed
        if (message.settings.uiTheme) {
          await updateToolbarIcon(message.settings.uiTheme);
        }
        return { success: true };
      
      case 'getAnimeCache':
        const cache = await browser.storage.local.get('animeCache');
        return cache.animeCache || {};
      
      case 'setAnimeCache':
        const existingCache = await browser.storage.local.get('animeCache');
        const updatedCache = { ...(existingCache.animeCache || {}), ...message.cache };
        await browser.storage.local.set({ animeCache: updatedCache });
        return { success: true };
      
      case 'injectIntoFrame':
        // Request from AniWorld script to inject into a specific frame
        if (sender.tab) {
          await injectContentScript(sender.tab.id, message.frameId);
        }
        return { success: true };
      
      default:
        return { error: 'Unknown action' };
    }
  };
  
  handleAsync().then(sendResponse);
  return true; // Keep the message channel open for async response
});

console.log('VOE AniSkip background script loaded');
