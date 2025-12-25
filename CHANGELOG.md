# Changelog

All notable changes to AniWorld AP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.2] - 2025-12-25

### Fixed
- Improved episode detection from video titles
- Fixed playback position restoration timing
- Enhanced in-progress episode marking reliability
- Fixed auto-play continuation between episodes

### Changed
- Better handling of VOE player iframe detection
- Improved error handling in content scripts

## [1.4.0] - 2025-12-24

### Added
- **Playback Position Memory** — Resume watching where you left off
  - Configurable expiration period (1-30 days)
  - Automatic clearing when episode completes
- **In-Progress Episode Marking** — Yellow highlight on episodes you've started but not finished
- **Language Preference Memory** — Remembers your preferred audio/subtitle language
- **Next Season Auto-Navigation** — Automatically continue to the next season

### Changed
- Redesigned settings popup with modern UI
- Improved anime name parsing from AniWorld pages

### Fixed
- Volume persistence across page refreshes
- Skip button positioning in fullscreen mode

## [1.3.0] - 2025-12-20

### Added
- **Progress Bar Markers** — Visual indicators on the video timeline
  - Shows opening, ending, and recap segments
  - Customizable colors for each segment type
  - Adjustable marker opacity
- **Skip Offset Setting** — Fine-tune where skips end (-5 to +5 seconds)

### Changed
- Improved skip detection accuracy
- Better handling of mixed opening/ending segments

## [1.2.0] - 2025-12-15

### Added
- **Skip Time Submission** — Contribute timestamps to the AniSkip database
- **Anime Search** — Manually search and select anime if auto-detection fails
- **Anime Cache** — Faster loading for previously watched anime

### Fixed
- Fixed skip times not loading for some anime titles
- Improved MAL ID matching accuracy

## [1.1.0] - 2025-12-10

### Added
- **Recap Skipping** — Auto-skip recap segments at episode beginnings
- **Play After Skip** — Optional automatic playback resume after skipping
- **Persistent Volume** — Volume settings remembered across sessions

### Changed
- Improved skip button styling
- Better integration with JWPlayer controls

## [1.0.0] - 2025-12-01

### Added
- Initial release
- Auto-skip openings and endings
- Manual skip buttons on video player
- Settings popup for configuration
- AniSkip API integration
- Jikan API for MAL lookups
- Support for AniWorld.to
- Support for VOE.sx player

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.4.2 | 2025-12-25 | Bug fixes and stability improvements |
| 1.4.0 | 2025-12-24 | Playback position memory, language preference |
| 1.3.0 | 2025-12-20 | Progress bar markers, skip offset |
| 1.2.0 | 2025-12-15 | Skip time submission, anime search |
| 1.1.0 | 2025-12-10 | Recap skipping, persistent volume |
| 1.0.0 | 2025-12-01 | Initial release |
