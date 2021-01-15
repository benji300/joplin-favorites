# Joplin Favorites

Joplin Favorites is a plugin to extend the UX and UI of [Joplin's](https://joplinapp.org/) desktop application.

It allows to add any notebook, note, to-do or tag to a favorites panel to access them quickly.

> :warning: **CAUTION** - Requires Joplin **v1.6.5** or newer

## Table of contents

- [Features](#features)
  - [Screenshots](#screenshots)
- [Usage](#usage)
- [Commands](#Commands)
- [User options](#user-options)
- [Installation](#installation)
- [Uninstallation](#uninstallation)
- [Feedback](#feedback)
- [Support](#support)
- [Development](#development)
- [Changes](#changes)
- [License](#license)

## Features

// TODO

- Add any of the following item types to a favorites panel
  - Notebook (Folder)
  - Note/to-do
  - Tag
  - Search query (currently not supported - hopefully added later)
- Set user defined names for the favorites
- Right-click on favorites to edit or remove
- Change position of favorites within the panel via drag & drop
- [Configurable](#user-options) style attributes
- Support horizontal and vertical layout

![screencast](./assets/screencast.gif)

### Screenshots

// TODO siehe assets ordner

#### Favorites above note content

![tabs-top-horizontal](./assets/tabs-top-horizontal.png)

### Tabs below note content

![tabs-bottom-horizontal](./assets/tabs-bottom-horizontal.png)

> **NOTE** - The used UI theme on this screenshot can be downloaded [here](https://github.com/benji300/joplin-wanaka-ui).

### Tabs beside note content (vertical layout)

![tabs-right-vertical](./assets/tabs-right-vertical.png)

> **NOTE** - The used UI theme on this screenshot can be downloaded [here](https://github.com/benji300/joplin-milford-ui).

## Usage

## Add to favorites

// TODO describe how to add favorites

## Edit/remove favorite

// TODO describe how to edit or remove a favorite

## Commands

This plugin provides additional commands as described in the following table.

| Command Label                   | Command ID             | Description                            | Menu contexts                                    |
| ------------------------------- | ---------------------- | -------------------------------------- | ------------------------------------------------ |
| Favorites: Add notebook         | `favsAddFolder`        | Add selected notebook to favorites     | `Tools>Favs`, `FolderContext`                    |
| Favorites: Add note             | `favsAddNote`          | Add selected note(s) to favorites      | `Tools>Favs`, `NoteListContext`, `EditorContext` |
| Favorites: Add tag              | `favsAddTag`           | Add selected tag to favorites          | `Tools>Favs`, `TagContext`                       |
| Favorites: Add search           | `favsAddSearch`        | Add current active search to favorites | `Tools>Favs`                                     |
| Favorites: Add new search       | `favsAddNewSearch`     | Add new search to favorites            | `Tools>Favs`                                     |
| Favorites: Remove all favorites | `favsClear`            | Remove all favorites                   | `Tools>Favs`                                     |
| Favorites: Toggle visibility    | `favsToggleVisibility` | Toggle panel visibility                | `Tools>Favs`                                     |

> **NOTE** - Keyboard shortcuts can be assigned in user options via `Tools > Options > Keyboard Shortcuts`. Search for the command label where shortcuts shall be added.

> **NOTE** - All commands can also be accessed via the `Command palette`.

## User options

This plugin adds provides user options which can be changed via `Tools > Options > Favorites`.

> **NOTE** - If `default` is set for an advanced style setting, the corresponding default color, font family, etc. will be used to match the common App look.

> **NOTE** - In case color settings shall be overwritten, they must be specified as valid CSS attribute values, e.g. `#ffffff`, `rgb(255,255,255)`, etc.

## Installation

### Joplin v1.6.4 and newer

- Open Joplin and navigate to `Tools > Options > Plugins`
- Search for `favorites` and press install
- Restart Joplin to enable the plugin

### Joplin v1.6.2 and previous

- Download the latest released JPL package (`joplin.plugin.benji.favorites.jpl`) from [here](https://github.com/benji300/joplin-favorites/releases)
- Open Joplin and navigate to `Tools > Options > Plugins`
- Press `Install plugin` and select the previously downloaded `jpl` file
- Confirm selection
- Restart Joplin to enable the plugin

### Place panel

By default the panel will be on the right side of the screen, this can be adjusted by:

- `View > Change application layout`
- Use the arrow keys (the displayed ones, not keyboard keys) to move the panel at the desired position
- Move the splitter to reach the desired height/width of the panel
- Press `ESC` to save the layout and return to normal mode

## Uninstallation

- Open Joplin
- Navigate to `Tools > Options > Plugins`
- Search for the `Favorites` plugin
- Press `Delete` to remove the plugin from the user profile directory
  - Alternatively you can also disable the plugin by clicking on the toggle button
- Restart Joplin

## Feedback

// TODO replace with concrete thread links

- :question: Need help?
  - Ask a question on the [Joplin Forum](https://discourse.joplinapp.org/t/plugin-note-tabs/12752)
- :bulb: An idea to improve or enhance the plugin?
  - Start a new discussion on the [Forum](https://discourse.joplinapp.org/t/plugin-note-tabs/12752) or upvote [popular feature requests](https://github.com/benji300/joplin-favorites/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement+sort%3Areactions-%2B1-desc+)
- :bug: Found a bug?
  - Check the [Forum](https://discourse.joplinapp.org/t/plugin-note-tabs/12752) if anyone else already reported the same issue. Otherwise report it by yourself.

## Support

You like this plugin as much as I do and it helps you in your daily work with Joplin?

Then I would be very happy if you would buy me a beer via [PayPal](https://www.paypal.com/donate?hosted_button_id=6FHDGK3PTNU22) :wink::beer:

## Development

### Building the plugin

If you want to build the plugin by your own simply run:

```
npm run dist
```

## Changes

See [CHANGELOG](./CHANGELOG.md) for details.

## License

Copyright (c) 2021 Benjamin Seifert

MIT License. See [LICENSE](./LICENSE) for more information.
