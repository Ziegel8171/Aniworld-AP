# Contributing to AniWorld AP

First off, thank you for considering contributing to AniWorld AP! It's people like you that make this extension better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Skip Times](#submitting-skip-times)
  - [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to making this a welcoming and inclusive community. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs what actually happened
- **Screenshots** if applicable
- **Browser version** and extension version
- **Any error messages** from the browser console (F12 → Console tab)

### Suggesting Features

Feature suggestions are welcome! Please include:

- **Clear description** of the feature
- **Use case** explaining why it would be useful
- **Possible implementation** if you have ideas

### Submitting Skip Times

One of the best ways to contribute is by submitting skip times for episodes that don't have them:

1. Play an episode on AniWorld
2. Find the start and end times of openings/endings
3. Use the "Submit Skip Time" feature in the extension panel
4. Your submission helps everyone watching that anime!

### Code Contributions

We welcome pull requests! Here's the general process:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Development Setup

### Prerequisites

- Firefox browser (version 58.0+)
- Git

### Getting Started

1. Clone your fork:
   ```bash
   git clone https://github.com/Ziegel8171/Aniworld-AP.git
   cd Aniworld-AP
   ```

2. Load the extension in Firefox:
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on..."
   - Select the `manifest.json` file

3. Make your changes and reload the extension to test

### Testing Changes

After making changes:

1. Go to `about:debugging` → "This Firefox"
2. Find "AniWorld AP" and click "Reload"
3. Test on an AniWorld episode page

### Building for Distribution

```bash
zip -r aniworld-ap.xpi * -x "*.git*" -x "*.md" -x "screenshots/*"
```

## Style Guidelines

### JavaScript

- Use ES6+ features
- Use meaningful variable and function names
- Add comments for complex logic
- Use `'use strict';` in IIFE wrappers
- Prefix console logs with `'VOE AniSkip:'` for easy filtering

Example:
```javascript
// Good
async function fetchSkipTimes(malId, episodeNumber) {
  console.log('VOE AniSkip: Fetching skip times for', malId, 'episode', episodeNumber);
  // ... implementation
}

// Avoid
async function fetch(id, ep) {
  console.log('fetching');
  // ...
}
```

### CSS

- Use CSS custom properties for theming
- Use meaningful class names with `aniskip-` prefix
- Keep styles scoped to avoid conflicts with host pages

### HTML

- Use semantic HTML elements
- Include appropriate ARIA attributes for accessibility
- Keep inline styles minimal

## Pull Request Process

1. **Update documentation** if your changes affect usage
2. **Test thoroughly** on multiple anime episodes
3. **Keep commits focused** — one feature/fix per commit
4. **Write clear commit messages**:
   ```
   Add playback position memory feature
   
   - Save position on pause/close
   - Restore position on episode load
   - Add configurable expiration
   ```

5. **Reference issues** in your PR description (e.g., "Fixes #123")

### PR Review Checklist

- [ ] Code follows the style guidelines
- [ ] Changes have been tested locally
- [ ] Documentation has been updated if needed
- [ ] No console errors or warnings introduced
- [ ] Changes work with existing features

## Questions?

Feel free to open an issue with your question, and we'll do our best to help!

---

Thank you for contributing! 🎉
