# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Updated plugin API to version v1.8.2 (`registerSettings`) to support app version v2.2.4 or newer

## [1.2.1] - 2021-02-23

### Fixed

- Issue that caused infinite message loop between plugin and app ([#7](https://github.com/benji300/joplin-note-tabs/issues/7))
- Ability to drag note favorites onto [note-tabs plugin](https://github.com/benji300/joplin-note-tabs) panel

## [1.2.0] - 2021-02-17

### Added

- Ability to drag & drop notes from [note-tabs plugin](https://github.com/benji300/joplin-note-tabs) to add as favorite
- Ability to rename and delete favorites directly in panel (vertical layout only)
  - Via new hover buttons on the right side

### Changed

- Drag & drop behavior to add notebooks, notes or to-dos
  - Move them onto the panel to add new favorite at the dropped position
- Scroll horizontally without holding `Shift` key
- Plugin command labels (Removed `Favs:` prefix)

### Fixed

- Search favorites with phrases in query cannot be opened, edited or deleted ([#4](https://github.com/benji300/joplin-favorites/issues/4))

## [1.1.0] - 2021-01-21

### Changed

- Improve style of scrollbar in vertical layout

### Fixed

- Edited search queries not saved
- Reduced opactiy of dragging favorite

## [1.0.0] - 2020-01-18

- Initial Release
