# AniWorld AP

<p align="center">
  <img src="icons/icon-96.png" alt="AniWorld AP Logo" width="96" height="96">
</p>

<p align="center">
  <strong>Skip anime openings and endings on AniWorld using AniSkip</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Features

- **Auto-Skip Openings & Endings** — Automatically skip intros and outros using community-sourced timestamps from [AniSkip](https://api.aniskip.com)
- **Skip Recap Segments** — Optionally skip recap sections at the beginning of episodes
- **Persistent Volume** — Your volume settings are remembered across episodes and sessions
- **Playback Position Memory** — Resume watching exactly where you left off
- **In-Progress Episode Marking** — Visual indicators for episodes you've started but not finished
- **Language Preference Memory** — Automatically selects your preferred audio/subtitle language
- **Progress Bar Markers** — Visual indicators on the video timeline showing skip segments
- **Manual Skip Buttons** — One-click buttons to skip to the next segment when auto-skip is disabled
- **Submit Skip Times** — Contribute timestamps to the AniSkip community database
- **Beautiful Settings UI** — Modern, sleek popup interface for configuration

## Installation

### Firefox

#### From Firefox Add-ons (Recommended)
*Coming soon*

#### Manual Installation (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/Ziegel8171/Aniworld-AP.git
   cd Aniworld-AP
   ```

2. Open Firefox and navigate to `about:debugging`

3. Click **"This Firefox"** in the left sidebar

4. Click **"Load Temporary Add-on..."**

5. Navigate to the cloned repository and select the `manifest.json` file

### Building the XPI

To create a distributable `.xpi` file:

```bash
cd Aniworld-AP
zip -r ../aniworld-ap.xpi * -x "*.git*" -x "*.md" -x "screenshots/*"
```

## Usage

1. **Navigate to AniWorld** — Go to [aniworld.to](https://aniworld.to) and open any anime episode

2. **Watch for Skip Buttons** — When skip times are available, buttons will appear on the video player:
   - `Skip Opening` — Skip the intro
   - `Skip Ending` — Skip the outro
   - `Skip Recap` — Skip recap segments

3. **Enable Auto-Skip** — Click the extension icon to open settings and enable automatic skipping

4. **Submit Timestamps** — If skip times aren't available, you can submit them to help the community

## Configuration

Click the extension icon to access the settings popup:

### Auto Skip
| Setting | Description |
|---------|-------------|
| Skip Opening | Automatically skip anime intros |
| Skip Ending | Automatically skip anime outros |
| Skip Recap | Automatically skip recap segments |

### Display
| Setting | Description |
|---------|-------------|
| Show Skip Buttons | Display manual skip buttons on the player |
| Skip Offset | Seconds to add/subtract from skip endpoint (-5 to 5) |

### Playback
| Setting | Description |
|---------|-------------|
| Play After Skip | Automatically resume playback after skipping |
| Remember Volume | Persist volume settings across episodes |
| Remember Position | Resume playback where you left off |
| Position Expiry | Days until saved position resets (1-30) |

### Progress Bar Colors
| Setting | Description |
|---------|-------------|
| Opening Marker | Color for intro segments on the timeline |
| Ending Marker | Color for outro segments on the timeline |
| Recap Marker | Color for recap segments on the timeline |
| Marker Opacity | Transparency of timeline markers (0.1-1.0) |

## How It Works

AniWorld AP integrates with the VOE video player embedded in AniWorld pages:

1. **Episode Detection** — The extension parses the AniWorld page to identify the current anime, season, and episode number

2. **MAL Lookup** — Uses the [Jikan API](https://jikan.moe/) to find the corresponding MyAnimeList ID

3. **Skip Times Fetch** — Queries the [AniSkip API](https://api.aniskip.com) for community-submitted skip timestamps

4. **Player Integration** — Injects controls into the VOE player iframe and monitors playback position

5. **Auto-Skip** — When enabled, automatically seeks past skip segments as they're reached

## Project Structure

```
aniworld-ap/
├── manifest.json          # Extension manifest (Manifest V2)
├── icons/
│   ├── icon-48.png        # Toolbar icon
│   └── icon-96.png        # High-DPI toolbar icon
└── src/
    ├── background.js      # Background script (API handling, injection)
    ├── aniworld.js        # Content script for AniWorld pages
    ├── content.js         # Content script for VOE player
    ├── popup.html         # Settings popup HTML
    ├── popup.js           # Settings popup logic
    └── styles.css         # Injected player UI styles
```

## API Usage

This extension uses the following external APIs:

- **[AniSkip API](https://api.aniskip.com)** — Community database of anime skip timestamps
- **[Jikan API](https://jikan.moe/)** — Unofficial MyAnimeList API for anime lookup

## Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** — Open an issue describing the problem and steps to reproduce

2. **Submit Skip Times** — Use the built-in submission feature to add timestamps for episodes without them

3. **Code Contributions**:
   ```bash
   # Fork the repository
   git clone https://github.com/Ziegel8171/Aniworld-AP.git
   cd Aniworld-AP
   
   # Create a feature branch
   git checkout -b feature/your-feature-name
   
   # Make your changes and test
   
   # Commit and push
   git commit -am "Add your feature"
   git push origin feature/your-feature-name
   
   # Open a Pull Request
   ```

## Privacy

This extension:
- **Does NOT** collect any personal information
- **Does NOT** track your viewing history
- **Stores locally**: Volume preference, playback positions, language preference, and anime cache
- **Sends to AniSkip API**: MAL ID and episode number when fetching/submitting skip times
- **Generates**: A random UUID stored locally as your submitter ID when contributing timestamps

## Known Issues

- Skip times may not be available for all episodes — consider contributing!
- Some video hosters other than VOE may not be fully supported
- Playback position may not restore correctly if the video takes too long to load

## Changelog

### v1.4.2
- Improved episode detection
- Fixed playback position restoration
- Enhanced in-progress episode marking

### v1.4.0
- Added persistent playback position memory
- Added in-progress episode visual indicators
- Added language preference memory
- Improved settings UI

### v1.3.0
- Added progress bar markers
- Added customizable marker colors
- Added skip offset setting

### v1.0.0
- Initial release
- Auto-skip openings, endings, and recaps
- Manual skip buttons
- Persistent volume

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [AniSkip](https://aniskip.com) for the skip times API
- [Jikan](https://jikan.moe) for the MyAnimeList API
- The anime community for contributing skip timestamps

---

<p align="center">
  Made with ❤️ for anime fans
</p>
