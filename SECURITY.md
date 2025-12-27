# Security Policy

## Supported Versions

We currently support the following versions of AniWorld AP with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | :white_check_mark: |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :x:                |
| 1.1.x   | :x:                |
| 1.0.x   | :x:                |

## Security Considerations

AniWorld AP is designed with privacy and security in mind:

### Data Storage
- All user preferences are stored **locally** using Firefox's `browser.storage.local` API
- No data is transmitted to third-party servers except:
  - AniSkip API (for fetching/submitting skip timestamps)
  - Jikan API (for anime information lookup)

### Network Requests
The extension makes requests to:
- `https://api.aniskip.com` - Skip time data
- `https://api.jikan.moe` - MyAnimeList information
- AniWorld.to domain - For content script injection

### Permissions
The extension requests the following permissions:
- `storage` - Store user preferences locally
- `activeTab` - Access current tab for content injection
- `webNavigation` - Detect page navigation
- `<all_urls>` - Inject content scripts into AniWorld and VOE player pages
- `https://api.aniskip.com/*` - Fetch skip times
- `https://api.jikan.moe/*` - Fetch anime information

### What We DON'T Do
- ❌ Track your viewing history
- ❌ Collect personal information
- ❌ Share data with advertisers
- ❌ Monitor your activity
- ❌ Access sensitive browser data
- ❌ Transmit data to our servers (we don't have any!)

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please DO NOT** report security vulnerabilities through public GitHub issues.

Instead, please report them via:

1. **GitHub Security Advisories** (Preferred)
   - Go to the [Security tab](https://github.com/Ziegel8171/Aniworld-AP/security)
   - Click "Report a vulnerability"
   - Fill out the form with details

2. **Email** (Alternative)
   - Send an email to: [Contact via GitHub profile]
   - Use subject line: "SECURITY: AniWorld AP Vulnerability Report"
   - Include detailed information (see below)

### What to Include

Please provide as much information as possible:

- **Type of vulnerability**
  - XSS, CSRF, injection, etc.
  
- **Step-by-step reproduction**
  - Exact steps to reproduce the issue
  - URLs, inputs, or configurations needed
  
- **Impact assessment**
  - What data could be accessed?
  - What actions could be performed?
  - Who is affected?
  
- **Proof of Concept**
  - Code snippets
  - Screenshots
  - Video demonstration (if applicable)
  
- **Suggested fixes**
  - If you have ideas on how to fix it

### Example Report Template

```markdown
## Vulnerability Summary
Brief description of the vulnerability

## Vulnerability Type
- [ ] Cross-Site Scripting (XSS)
- [ ] Code Injection
- [ ] Information Disclosure
- [ ] Privilege Escalation
- [ ] Other: __________

## Affected Versions
- Version: 1.4.4
- Component: content.js

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Impact
- Severity: Critical/High/Medium/Low
- Who is affected: All users / Specific configuration / etc.
- Potential damage: Data leak / Code execution / etc.

## Proof of Concept
```javascript
// Code snippet or link to PoC
```

## Suggested Fix
Your recommendations for fixing the issue

## Disclosure Timeline
When do you plan to publicly disclose this?
```

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - **Critical**: 1-3 days
  - **High**: 1-2 weeks
  - **Medium**: 2-4 weeks
  - **Low**: Next release cycle

### Disclosure Policy

We follow **coordinated disclosure**:

1. You report the vulnerability privately
2. We acknowledge and investigate
3. We develop and test a fix
4. We release a patched version
5. We publicly disclose the issue (with credit to you, if desired)

Typical disclosure timeline: **90 days** after initial report (or sooner if a fix is released)

## Security Best Practices for Users

### Keep Updated
- Always use the latest version
- Enable automatic updates in Firefox
- Check for updates regularly

### Verify Installation
- Only install from:
  - Official Firefox Add-ons store
  - This GitHub repository (signed releases)
- Verify the publisher/developer name

### Review Permissions
- Understand what permissions the extension requests
- Don't grant unnecessary permissions
- Review permission changes in updates

### Safe Browsing
- Use HTTPS on all sites
- Keep Firefox updated
- Use additional security extensions (uBlock Origin, etc.)

## Known Security Limitations

### Browser Extension Limitations
- Content scripts run in semi-isolated environments
- Can potentially be affected by malicious page scripts
- Limited control over third-party API responses

### Third-Party Dependencies
- Relies on AniSkip API availability and security
- Relies on Jikan API availability and security
- No control over AniWorld.to site security

## Security Updates

Security patches will be released as:
- **Patch versions** (1.4.x) for minor security fixes
- **Minor versions** (1.x.0) for significant security improvements
- **Major versions** (x.0.0) for breaking security changes

Check [CHANGELOG.md](CHANGELOG.md) for security-related updates.

## Security Hall of Fame

We appreciate responsible security researchers who help keep AniWorld AP safe:

<!-- Security researchers who report vulnerabilities will be listed here -->

*No vulnerabilities reported yet*

---

## Questions?

If you have questions about this security policy or need clarification:
- Open a **public** issue for general questions
- Use **private** channels for sensitive security matters

Thank you for helping keep AniWorld AP and its users safe! 🛡️
