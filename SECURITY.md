# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | :white_check_mark: |
| 1.3.x   | :white_check_mark: |
| < 1.3   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within AniWorld AP, please follow these steps:

1. **Do NOT** open a public issue
2. Send a private report via GitHub's security advisory feature, or contact the maintainers directly
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Considerations

### Permissions Used

This extension requests the following permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | Save user settings and playback positions locally |
| `activeTab` | Interact with the current tab when user activates the extension |
| `webNavigation` | Detect iframe navigations to inject content script into video player |
| `<all_urls>` | Inject content script into VOE player iframes (various domains) |
| `https://api.aniskip.com/*` | Fetch and submit skip times |
| `https://api.jikan.moe/*` | Look up anime information |

### Data Handling

- **Local Storage Only**: All user preferences and playback data are stored locally using `browser.storage.local`
- **No Analytics**: The extension does not collect or transmit usage analytics
- **No Personal Data**: No personally identifiable information is collected
- **API Communication**: 
  - Skip time queries include only MAL ID and episode number
  - Submissions include a randomly generated UUID (not linked to user identity)

### Third-Party APIs

This extension communicates with:

1. **AniSkip API** (`api.aniskip.com`)
   - Purpose: Fetch and submit anime skip timestamps
   - Data sent: MAL ID, episode number, skip times
   
2. **Jikan API** (`api.jikan.moe`)
   - Purpose: Look up anime information from MyAnimeList
   - Data sent: Search queries (anime titles)

Both APIs are public and do not require authentication.

## Best Practices for Users

1. **Install from trusted sources only** — Use official releases or build from source
2. **Review permissions** — Understand what the extension can access
3. **Keep updated** — Install updates to receive security fixes
4. **Report issues** — Let us know if something seems wrong
