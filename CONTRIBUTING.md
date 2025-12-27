# Contributing to AniWorld AP

First off, thank you for considering contributing to AniWorld AP! It's people like you that make AniWorld AP such a great tool for the anime community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Contributing Skip Times](#contributing-skip-times)
  - [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by a simple principle: **Be respectful and considerate**. We expect all contributors to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/Ziegel8171/Aniworld-AP/issues) to avoid duplicates.

When creating a bug report, please include:

- **Clear title** — Use a descriptive title
- **Steps to reproduce** — Detailed steps to reproduce the issue
- **Expected behavior** — What you expected to happen
- **Actual behavior** — What actually happened
- **Screenshots** — If applicable, add screenshots
- **Environment**:
  - Browser version (Firefox version)
  - Extension version
  - Operating system
- **Additional context** — Any other relevant information

Example:

```markdown
**Bug**: Skip button doesn't appear for Episode 5 of [Anime Name]

**Steps to Reproduce**:
1. Go to [URL]
2. Play episode 5
3. Wait for video to load

**Expected**: Skip Opening button should appear
**Actual**: No skip button appears

**Environment**:
- Firefox 120.0
- Extension v1.4.4
- Windows 11

**Additional Info**: 
- Skip times are available in AniSkip API
- Works fine on other episodes
```

### Suggesting Features

We love feature suggestions! Please create an issue with:

- **Clear description** — What feature you'd like to see
- **Use case** — Why this feature would be useful
- **Examples** — How it might work
- **Mockups** — Visual examples if applicable

### Contributing Skip Times

The easiest way to contribute is by adding skip times for episodes that don't have them:

1. **Watch the episode** and note the timestamps for:
   - Opening start and end
   - Ending start and end
   - Recap start and end (if applicable)

2. **Use the extension** to submit:
   - Click the extension icon
   - Look for "Submit Skip Times" button (when no times exist)
   - Enter the timestamps accurately
   - Submit to AniSkip API

3. **Verify** your submission by reloading the page and checking if skip times work correctly

### Code Contributions

We welcome code contributions! Here's how to get started:

## Development Setup

### Prerequisites

- Firefox Developer Edition (recommended) or Firefox 58+
- Git
- Text editor (VS Code, Sublime Text, etc.)
- Basic knowledge of:
  - JavaScript
  - WebExtensions API
  - HTML/CSS

### Setup Steps

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Aniworld-AP.git
   cd Aniworld-AP
   ```

3. **Create a development branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

4. **Load the extension in Firefox**
   - Open Firefox
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from the repository

5. **Make your changes**
   - Edit files in the `src/` directory
   - The extension will reload automatically when you click "Reload" in `about:debugging`

### Testing Your Changes

Before submitting:

1. **Test on AniWorld.to**
   - Navigate to various anime pages
   - Test with different episodes
   - Verify skip functionality works
   - Check settings persistence

2. **Test edge cases**
   - Episodes without skip times
   - Very long/short skip segments
   - Different video players (if applicable)
   - Different languages/subtitles

3. **Check browser console**
   - Look for errors (F12 → Console)
   - Verify no unexpected warnings

4. **Test the popup**
   - Open extension settings
   - Toggle all options
   - Verify settings save correctly

## Pull Request Process

1. **Ensure code quality**
   - Follow the [Style Guidelines](#style-guidelines)
   - Comment your code where necessary
   - Remove debug `console.log()` statements

2. **Update documentation**
   - Update README.md if you added features
   - Add entry to CHANGELOG.md
   - Update inline code comments

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature: [brief description]"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "Pull Request"
   - Select your branch
   - Fill out the PR template
   - Link related issues

6. **Respond to feedback**
   - Address review comments
   - Make requested changes
   - Push updates to the same branch

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on multiple episodes
- [ ] Tested settings changes
- [ ] No console errors
- [ ] Works with both themes

## Screenshots
If applicable, add screenshots

## Related Issues
Closes #[issue number]
```

## Style Guidelines

### JavaScript

- **Use ES6+ features** where appropriate
- **Use meaningful variable names**
  ```javascript
  // Good
  const episodeNumber = getEpisodeFromUrl();
  
  // Bad
  const n = getEpisodeFromUrl();
  ```

- **Add comments for complex logic**
  ```javascript
  // Extract episode number from URL pattern: /episode-5
  const episodeMatch = url.match(/episode-(\d+)/);
  ```

- **Use async/await** for promises
  ```javascript
  // Good
  async function fetchSkipTimes() {
    const response = await fetch(url);
    return await response.json();
  }
  
  // Avoid
  function fetchSkipTimes() {
    return fetch(url).then(r => r.json());
  }
  ```

- **Error handling**
  ```javascript
  try {
    await fetchSkipTimes();
  } catch (error) {
    console.error('Failed to fetch skip times:', error);
  }
  ```

### HTML/CSS

- **Use semantic HTML**
- **BEM naming** for CSS classes
- **CSS variables** for theming
- **Responsive units** (rem, em, %)

### Code Organization

- **Keep functions small** (<50 lines ideally)
- **Single responsibility** — one function, one purpose
- **Group related code** together
- **Use constants** for magic numbers

### Commit Messages

Use clear, descriptive commit messages:

```bash
# Good
git commit -m "Add auto-play delay configuration option"
git commit -m "Fix skip button positioning on mobile"
git commit -m "Update README with new features"

# Bad
git commit -m "Update"
git commit -m "Fix bug"
git commit -m "Changes"
```

Follow conventional commits format when possible:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Project Structure

```
Aniworld-AP/
├── manifest.json       # Extension configuration
├── src/
│   ├── background.js   # Background service worker
│   ├── aniworld.js     # AniWorld page content script
│   ├── content.js      # VOE player content script
│   ├── popup.html      # Settings UI
│   ├── popup.js        # Settings logic
│   └── styles.css      # Injected styles
├── icons/              # Extension icons
├── docs/               # GitHub Pages
└── README.md           # Main documentation
```

### File Purposes

- **background.js**: Handles API requests, message passing, tab management
- **aniworld.js**: Detects anime info, handles episode navigation
- **content.js**: Controls video player, skip functionality
- **popup.js**: Settings UI logic, storage management
- **styles.css**: Visual styling for injected player controls

## Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas (if enabled)

### Recognition

Contributors will be recognized in:
- GitHub contributors page
- Future README acknowledgments section
- Release notes for significant contributions

## Questions?

Don't hesitate to ask! Open an issue with the label `question` or contact the maintainers.

---

Thank you for contributing to AniWorld AP! 🎌
