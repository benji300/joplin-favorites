import joplin from 'api';
import { MenuItem, MenuItemLocation, SettingItemType } from 'api/types';
import { ChangeEvent } from 'api/JoplinSettings';
import { FavoriteType, FavoriteDesc, Favorites } from './helpers';
import { SettingDefaults, } from './helpers';

joplin.plugins.register({
  onStart: async function () {
    const COMMANDS = joplin.commands;
    const DATA = joplin.data;
    const DIALOGS = joplin.views.dialogs;
    const PANELS = joplin.views.panels;
    const SETTINGS = joplin.settings;
    const WORKSPACE = joplin.workspace;

    //#region SETTINGS

    await SETTINGS.registerSection('favorites.settings', {
      label: 'Favorites',
      iconName: 'fas fa-star'
    });

    // private settings
    let favorites = new Favorites();
    await SETTINGS.registerSetting('favorites', {
      value: [],
      type: SettingItemType.Array,
      section: 'favorites.settings',
      public: false,
      label: 'Favorites'
    });
    await favorites.read();

    // general settings
    let editBeforeAdd: boolean;
    await SETTINGS.registerSetting('editBeforeAdd', {
      value: true,
      type: SettingItemType.Bool,
      section: 'favorites.settings',
      public: true,
      label: 'Edit favorite before add',
      description: 'Opens a dialog to edit the favorite before adding it. If disabled, the name can still be changed later.'
    });

    let enableDragAndDrop: boolean;
    await SETTINGS.registerSetting('enableDragAndDrop', {
      value: true,
      type: SettingItemType.Bool,
      section: 'favorites.settings',
      public: true,
      label: 'Enable drag & drop of favorites',
      description: 'If enabled, the position of favorites can be change via drag & drop.'
    });

    let showPanelTitle: boolean;
    await SETTINGS.registerSetting('showPanelTitle', {
      value: true,
      type: SettingItemType.Bool,
      section: 'favorites.settings',
      public: true,
      label: 'Show favorites panel title',
      description: "Display 'FAVORITES' title in front of the favorites."
    });

    let showTypeIcons: boolean;
    await SETTINGS.registerSetting('showTypeIcons', {
      value: true,
      type: SettingItemType.Bool,
      section: 'favorites.settings',
      public: true,
      label: 'Show type icons for favorites',
      description: 'Display icons before favorite titles representing the types (notebook, note, tag, etc.).'
    });

    let lineHeight: number;
    await SETTINGS.registerSetting('lineHeight', {
      value: "30",
      type: SettingItemType.Int,
      section: 'favorites.settings',
      public: true,
      label: 'Line height (px)',
      description: 'Line height of the favorites panel.'
    });

    let minWidth: number;
    await SETTINGS.registerSetting('minFavoriteWidth', {
      value: "15",
      type: SettingItemType.Int,
      section: 'favorites.settings',
      public: true,
      label: 'Minimum favorite width (px)',
      description: 'Minimum width of one favorite in pixel.'
    });

    let maxWidth: number;
    await SETTINGS.registerSetting('maxFavoriteWidth', {
      value: "100",
      type: SettingItemType.Int,
      section: 'favorites.settings',
      public: true,
      label: 'Maximum favorite width (px)',
      description: 'Maximum width of one favorite in pixel.'
    });

    // advanced settings
    let fontFamily: string;
    await SETTINGS.registerSetting('fontFamily', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Font family',
      description: "Font family used in the panel. Font families other than 'default' must be installed on the system. If the font is incorrect or empty, it might default to a generic sans-serif font. (default: Roboto)"
    });

    let fontSize: string;
    await SETTINGS.registerSetting('fontSize', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Font size',
      description: "Font size used in the panel. Values other than 'default' must be specified in valid CSS syntax, e.g. '13px'. (default: App default font size)"
    });

    let background: string;
    await SETTINGS.registerSetting('mainBackground', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Background color',
      description: 'Main background color of the panel. (default: Note list background color)'
    });

    let hoverBackground: string;
    await SETTINGS.registerSetting('hoverBackground', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Hover Background color',
      description: 'Background color used when hovering a favorite. (default: Note list hover color)'
    });

    let foreground: string;
    await SETTINGS.registerSetting('mainForeground', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Foreground color',
      description: 'Foreground color used for text and icons. (default: App faded color)'
    });

    let dividerColor: string;
    await SETTINGS.registerSetting('dividerColor', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Divider color',
      description: 'Color of the divider between the favorites. (default: App default border color)'
    });

    const regexp: RegExp = new RegExp(SettingDefaults.Default, "i");
    async function getSettingOrDefault(event: ChangeEvent, localVar: any, setting: string, defaultValue?: string): Promise<any> {
      const read: boolean = (!event || event.keys.includes(setting));
      if (read) {
        const value: string = await SETTINGS.value(setting);
        if (defaultValue && value.match(regexp)) {
          return defaultValue;
        } else {
          return value;
        }
      }
      return localVar;
    }

    async function readSettingsAndUpdate(event?: ChangeEvent) {
      enableDragAndDrop = await getSettingOrDefault(event, enableDragAndDrop, 'enableDragAndDrop');
      showPanelTitle = await getSettingOrDefault(event, showPanelTitle, 'showPanelTitle');
      showTypeIcons = await getSettingOrDefault(event, showTypeIcons, 'showTypeIcons');
      editBeforeAdd = await getSettingOrDefault(event, editBeforeAdd, 'editBeforeAdd');
      lineHeight = await getSettingOrDefault(event, lineHeight, 'lineHeight');
      maxWidth = await getSettingOrDefault(event, maxWidth, 'maxFavoriteWidth');
      minWidth = await getSettingOrDefault(event, minWidth, 'minFavoriteWidth');
      fontFamily = await getSettingOrDefault(event, fontFamily, 'fontFamily', SettingDefaults.FontFamily);
      fontSize = await getSettingOrDefault(event, fontSize, 'fontSize', SettingDefaults.FontSize);
      background = await getSettingOrDefault(event, background, 'mainBackground', SettingDefaults.Background);
      hoverBackground = await getSettingOrDefault(event, hoverBackground, 'hoverBackground', SettingDefaults.HoverBackground);
      foreground = await getSettingOrDefault(event, foreground, 'mainForeground', SettingDefaults.Foreground);
      dividerColor = await getSettingOrDefault(event, dividerColor, 'dividerColor', SettingDefaults.DividerColor);
      await updatePanelView();
    }

    SETTINGS.onChange(async (event: ChangeEvent) => {
      await readSettingsAndUpdate(event);
    });

    //#endregion

    //#region HELPERS

    /**
      * Check if favorite target still exists - otherwise ask to remove favorite
      */
    async function checkAndRemoveFavorite(favorite: any): Promise<boolean> {
      try {
        await DATA.get([FavoriteDesc[favorite.type].dataType, favorite.value], { fields: ['id'] });
      } catch (err) {
        const result: number = await DIALOGS.showMessageBox(`Cannot open favorite. Seems that the target ${FavoriteDesc[favorite.type].name.toLocaleLowerCase()} was deleted.\n\nDo you want to delete the favorite also?`);
        if (!result) {
          await favorites.delete(favorite.value);
          await updatePanelView();
          return true;
        }
      }
      return false;
    }

    /**
     * Check if note/todo is still of the same type - otherwise change type
     */
    async function checkAndUpdateType(favorite: any) {
      let newType: FavoriteType;
      const note: any = await DATA.get([FavoriteDesc[favorite.type].dataType, favorite.value], { fields: ['id', 'is_todo'] });
      if (favorite.type === FavoriteType.Note && note.is_todo) newType = FavoriteType.Todo;
      if (favorite.type === FavoriteType.Todo && (!note.is_todo)) newType = FavoriteType.Note;
      if (newType) {
        await favorites.changeType(favorite.value, newType);
        await updatePanelView();
      }
    }

    /**
     * Gets the full path, tag name or search query for the favorite.
     */
    async function getFavoritePath(value: string, type: FavoriteType): Promise<string> {
      switch (type) {
        case FavoriteType.Folder:
        case FavoriteType.Note:
        case FavoriteType.Todo:
          const item = await DATA.get([FavoriteDesc[type].dataType, value], { fields: ['title', 'parent_id'] });
          if (item) {
            let parents: any[] = new Array();
            let parent_id: string = item.parent_id;

            while (parent_id) {
              const parent: any = await DATA.get(['folders', parent_id], { fields: ['title', 'parent_id'] });
              if (!parent) break;
              parent_id = parent.parent_id;
              parents.push(parent.title);
            }
            parents.reverse().push(item.title);
            return parents.join('/');
          }

        case FavoriteType.Tag:
          const tag = await DATA.get([FavoriteDesc[type].dataType, value], { fields: ['title'] });
          if (tag) return tag.title;

        case FavoriteType.Search:
          return value;

        default:
          break;
      }
      return '';
    }

    async function openFavorite(value: string) {
      const favorite: any = await favorites.get(value);
      if (!favorite) return;

      switch (favorite.type) {
        case FavoriteType.Folder:
          if (await checkAndRemoveFavorite(favorite)) return;
          COMMANDS.execute('openFolder', value);
          break;

        case FavoriteType.Note:
        case FavoriteType.Todo:
          if (await checkAndRemoveFavorite(favorite)) return;
          await checkAndUpdateType(favorite);
          COMMANDS.execute('openNote', value);
          break;

        case FavoriteType.Tag:
          if (await checkAndRemoveFavorite(favorite)) return;
          COMMANDS.execute('openTag', value);
          break;

        case FavoriteType.Search:
          // TODO there is a command `~\app-desktop\gui\MainScreen\commands\search.ts` avaiable, but currently empty
          // use this once it is implemented

          // currently there's no command to trigger a global search, so the following workaround is used
          // 1. copy saved search to clipboard
          const copy = require('../node_modules/copy-to-clipboard');
          copy(favorite.value as string);
          // 2. focus global search bar via command
          await COMMANDS.execute('focusSearch');
          // 3. paste clipboard content to current cursor position (should be search bar now)
          // TODO how?
          break;

        default:
          break;
      }
    }

    async function addFavorite(value: string, title: string, type: FavoriteType, showDialog: boolean) {
      let newValue: string = value;
      let newTitle: string = title;

      // check whether a favorite with handled value already exists
      if (favorites.hasFavorite(value)) {

        // if so... open editFavorite dialog
        await editFavorite(value);
      } else {

        // otherwise create new favorite, with or without user interaction
        if (showDialog) {

          // prepare and open dialog
          const dialogHtml: string = await prepareDialogHtml('Add', value, newTitle, type);
          await DIALOGS.setHtml(dialogAdd, dialogHtml);
          const result: any = await DIALOGS.open(dialogAdd);

          // handle result
          if (result.id == 'ok' && result.formData != null) {
            newTitle = result.formData.inputForm.title;
            if (result.formData.inputForm.value)
              newValue = result.formData.inputForm.value;
          } else
            return;
        }

        if (newValue === '' || newTitle === '')
          return;

        await favorites.add(newValue, newTitle, type);
        await updatePanelView();
      }
    }

    async function editFavorite(value: string) {
      const favorite: any = await favorites.get(value);
      if (!favorite) return;

      // prepare and open dialog
      const dialogHtml: string = await prepareDialogHtml('Edit', favorite.value, favorite.title, favorite.type);
      await DIALOGS.setHtml(dialogEdit, dialogHtml);
      const result: any = await DIALOGS.open(dialogEdit);

      // handle result
      if (result.id == "ok" && result.formData != null) {
        await favorites.changeTitle(value, result.formData.inputForm.title);
        await favorites.changeValue(value, result.formData.inputForm.value);
        await updatePanelView();
      } else if (result.id == "delete") {
        await favorites.delete(value);
        await updatePanelView();
      } else {
        return;
      }
    }

    //#endregion

    //#region COMMANDS

    // Command: favsAddFolder
    // Desc: Add selected folder to favorites
    await COMMANDS.register({
      name: 'favsAddFolder',
      label: 'Favorites: Add notebook',
      iconName: 'fas fa-book',
      enabledCondition: 'oneFolderSelected',
      execute: async (folderId: string) => {
        if (folderId) {
          const folder = await DATA.get(['folders', folderId], { fields: ['id', 'title'] });
          if (!folder) return;

          await addFavorite(folder.id, folder.title, FavoriteType.Folder, editBeforeAdd);
        } else {
          const selectedFolder: any = await WORKSPACE.selectedFolder();
          if (!selectedFolder) return;

          await addFavorite(selectedFolder.id, selectedFolder.title, FavoriteType.Folder, editBeforeAdd);
        }
      }
    });

    // Command: favsAddNote
    // Desc: Add selected note to favorites
    await COMMANDS.register({
      name: 'favsAddNote',
      label: 'Favorites: Add note',
      iconName: 'fas fa-sticky-note',
      enabledCondition: "someNotesSelected",
      execute: async (noteIds: string[]) => {
        if (noteIds) {

          // in case multiple notes are selected - add them directly without user interaction
          for (const noteId of noteIds) {
            if (noteIds.length > 1 && favorites.hasFavorite(noteId)) continue;

            const note = await DATA.get(['notes', noteId], { fields: ['id', 'title', 'is_todo'] });
            if (!note) return;

            // never show dialog for multiple notes
            const showDialog: boolean = (editBeforeAdd && noteIds.length == 1);
            await addFavorite(note.id, note.title, note.is_todo ? FavoriteType.Todo : FavoriteType.Note, showDialog);
          }
        } else {
          const selectedNote: any = await WORKSPACE.selectedNote();
          if (!selectedNote) return;

          await addFavorite(selectedNote.id, selectedNote.title, selectedNote.is_todo ? FavoriteType.Todo : FavoriteType.Note, editBeforeAdd);
        }
      }
    });

    // Command: favsAddTag
    // Desc: Add tag to favorites
    await COMMANDS.register({
      name: 'favsAddTag',
      label: 'Favorites: Add tag',
      iconName: 'fas fa-tag',
      execute: async (tagId: string) => {
        if (tagId) {
          const tag = await DATA.get(['tags', tagId], { fields: ['id', 'title'] });
          if (!tag) return;

          await addFavorite(tag.id, tag.title, FavoriteType.Tag, editBeforeAdd);
        }
      }
    });

    // Command: favsAddSearch
    // Desc: Add entered search query to favorites
    await COMMANDS.register({
      name: 'favsAddSearch',
      label: 'Favorites: Add Search',
      iconName: 'fas fa-search',
      execute: async () => {
        await addFavorite('', 'New Search', FavoriteType.Search, true); // always add with dialog
      }
    });

    // Command: favsClear
    // Desc: Remove all favorites
    await COMMANDS.register({
      name: 'favsClear',
      label: 'Favorites: Remove all favorites',
      iconName: 'fas fa-times',
      execute: async () => {
        // ask user before removing favorites
        const result: number = await DIALOGS.showMessageBox(`Remove all favorites?`);
        if (result) return;

        await favorites.clearAll();
        await updatePanelView();
      }
    });

    // Command: favsToggleVisibility
    // Desc: Toggle panel visibility
    await COMMANDS.register({
      name: 'favsToggleVisibility',
      label: 'Favorites: Toggle visibility',
      iconName: 'fas fa-eye-slash',
      execute: async () => {
        const isVisible: boolean = await PANELS.visible(panel);
        await PANELS.show(panel, (!isVisible));
      }
    });

    // prepare commands menu
    const commandsSubMenu: MenuItem[] = [
      {
        commandName: "favsAddFolder",
        label: 'Add selected notebook'
      },
      {
        commandName: "favsAddNote",
        label: 'Add selected note'
      },
      {
        commandName: "favsAddSearch",
        label: 'Add search'
      },
      // {
      //   commandName: "favsAddActiveSearch",
      //   label: 'Add current active search'
      // },
      {
        commandName: "favsClear",
        label: 'Remove all favorites'
      },
      {
        commandName: "favsToggleVisibility",
        label: 'Toggle panel visibility'
      }
    ];
    await joplin.views.menus.create('toolsFavorites', 'Favorites', commandsSubMenu, MenuItemLocation.Tools);

    // add commands to folders context menu
    await joplin.views.menuItems.create('foldersContextMenuAddFolder', 'favsAddFolder', MenuItemLocation.FolderContextMenu);

    // add commands to tags context menu
    await joplin.views.menuItems.create('tagsContextMenuAddNote', 'favsAddTag', MenuItemLocation.TagContextMenu);

    // add commands to notes context menu
    await joplin.views.menuItems.create('notesContextMenuAddNote', 'favsAddNote', MenuItemLocation.NoteListContextMenu);

    // add commands to editor context menu
    await joplin.views.menuItems.create('editorContextMenuAddNote', 'favsAddNote', MenuItemLocation.EditorContextMenu);

    //#endregion

    //#region DIALOGS

    // prepare dialog objects
    const dialogAdd = await DIALOGS.create('dialogAdd');
    await DIALOGS.addScript(dialogAdd, './assets/fontawesome/css/all.min.css');
    await DIALOGS.addScript(dialogAdd, './webview_dialog.css');

    const dialogEdit = await DIALOGS.create('dialogEdit');
    await DIALOGS.addScript(dialogEdit, './assets/fontawesome/css/all.min.css');
    await DIALOGS.addScript(dialogEdit, './webview_dialog.css');
    await DIALOGS.setButtons(dialogEdit, [
      { id: 'delete', title: 'Delete', },
      { id: 'ok', title: 'OK' },
      { id: 'cancel', title: 'Cancel' }
    ]);

    // prepare dialog HTML content
    async function prepareDialogHtml(header: string, value: string, title: string, type: FavoriteType): Promise<string> {
      const path: string = await getFavoritePath(value, type);
      const disabled: string = (type === FavoriteType.Search) ? '' : 'disabled';

      return `
        <div>
          <h3><i class="fas ${FavoriteDesc[type].icon}"></i>${header} ${FavoriteDesc[type].name} Favorite</h3>
          <form name="inputForm">
            <label for="title"><strong>Name</strong></label>
            <input type="text" id="title" name="title" value="${title}" autofocus required>
            <label for="value"><strong>${FavoriteDesc[type].label}</strong></label>
            <textarea id="value" name="value" rows="3" ${disabled} required>${path}</textarea>
          </form>
        </div>
      `;
    }

    //#endregion

    //#region PANELS

    // prepare panel object
    const panel = await PANELS.create('favorites.panel');
    await PANELS.addScript(panel, './assets/fontawesome/css/all.min.css');
    await PANELS.addScript(panel, './webview.css');
    await PANELS.addScript(panel, './webview.js');
    await PANELS.onMessage(panel, async (message: any) => {
      if (message.name === 'favsAddFolder') {
        await COMMANDS.execute('favsAddFolder', message.id);
      }
      if (message.name === 'favsAddNote') {
        await COMMANDS.execute('favsAddNote', message.id);
      }
      if (message.name === 'favsEdit') {
        editFavorite(message.id);
      }
      if (message.name === 'favsOpen') {
        openFavorite(message.id);
      }
      if (message.name === 'favsDrag') {
        await favorites.moveWithValue(message.sourceId, message.targetId);
        await updatePanelView();
      }
    });

    // set init message
    await PANELS.setHtml(panel, `
      <div id="container" style="background:${background};font-family:'${fontFamily}',sans-serif;font-size:${fontSize};">
        <div id="container-inner">
          <p style="padding-left:8px;">Loading panel...</p>
        </div>
      </div>
    `);

    // update HTML content
    async function updatePanelView() {
      const favsHtml: any = [];

      // prepare panel title if enabled
      let panelTitleHtml: string = '';
      if (showPanelTitle) {
        panelTitleHtml = `
          <div id="panel-title" style="height:${lineHeight}px;"
            ondragover="dragOverTitle(event);" ondragleave="dragLeave(event);" ondrop="dropOnTitle(event);" ondragend="dragLeave(event);">
            <span class="fas fa-star" style="color:${foreground};"></span>
            <span class="title" style="color:${foreground};">FAVORITES</span>
          </div>
        `;
      }

      // create HTML for each favorite
      for (const favorite of favorites.getAll()) {
        let typeIconHtml: string = '';
        if (showTypeIcons)
          typeIconHtml = `<span class="fas ${FavoriteDesc[favorite.type].icon}" style="color:${foreground};"></span>`;

        favsHtml.push(`
          <div id="favorite" data-id="${favorite.value}" draggable="${enableDragAndDrop}"
            onclick="favsClick(event);" oncontextmenu="favsContext(event);" onMouseOver="this.style.background='${hoverBackground}';" onMouseOut="this.style.background='none';"
            ondragstart="dragStart(event);" ondragover="dragOver(event, '${hoverBackground}');" ondragleave="dragLeave(event);" ondrop="drop(event);" ondragend="dragEnd(event);"
            style="height:${lineHeight}px;min-width:${minWidth}px;max-width:${maxWidth}px;background:${background};border-color:${dividerColor};color:${foreground};">
            <span class="favorite-inner" style="border-color:${dividerColor};">
              ${typeIconHtml}
              <span class="title" title="${favorite.title}">
                ${favorite.title}
              </span>
            </span>
          </div>
        `);
      }

      // add entries to container and push to panel
      await PANELS.setHtml(panel, `
        <div id="container" style="background:${background};font-family:'${fontFamily}',sans-serif;font-size:${fontSize};">
          <div id="container-inner">
            ${panelTitleHtml}
            ${favsHtml.join('\n')}
          </div>
        </div>
      `);
    }

    //#endregion

    //#region EVENTS

    //#endregion

    await readSettingsAndUpdate();
  }
});
