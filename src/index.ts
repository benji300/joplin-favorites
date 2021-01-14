import joplin from 'api';
import { MenuItem, MenuItemLocation, SettingItemType } from 'api/types';
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

    //#region USER OPTIONS

    await SETTINGS.registerSection('favorites.settings', {
      label: 'Favorites',
      iconName: 'fas fa-star',
      description: 'Changes are applied after selecting another note.'
    });

    await SETTINGS.registerSetting('favorites', {
      value: [],
      type: SettingItemType.Array,
      section: 'favorites.settings',
      public: false,
      label: 'Favorites'
    });

    // General settings
    await SETTINGS.registerSetting('enableDragAndDrop', {
      value: true,
      type: SettingItemType.Bool,
      section: 'favorites.settings',
      public: true,
      label: 'Enable drag & drop of favorites',
      description: 'If enabled, the position of favorites can be change via drag & drop.'
    });
    await SETTINGS.registerSetting('showTypeIcons', {
      value: true,
      type: SettingItemType.Bool,
      section: 'favorites.settings',
      public: true,
      label: 'Show type icons for favorites',
      description: 'Display icons before favorite titles representing the types (notebook, note, tag, etc.).'
    });
    await SETTINGS.registerSetting('lineHeight', {
      value: "30",
      type: SettingItemType.Int,
      section: 'favorites.settings',
      public: true,
      label: 'Favorites line height (px)',
      description: 'Line height of the favorites panel.'
    });
    await SETTINGS.registerSetting('minFavoriteWidth', {
      value: "15",
      type: SettingItemType.Int,
      section: 'favorites.settings',
      public: true,
      label: 'Minimum favorite width (px)',
      description: 'Minimum width   of one favorite entry in pixel.'
    });
    await SETTINGS.registerSetting('maxFavoriteWidth', {
      value: "100",
      type: 1,
      section: 'favorites.settings',
      public: true,
      label: 'Maximum favorite width (px)',
      description: 'Maximum width of one favorite entry in pixel.'
    });

    // Advanced settings
    await SETTINGS.registerSetting('fontFamily', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Font family',
      description: "Font family used in the panel. Font families other than 'default' must be installed on the system. If the font is incorrect or empty, it might default to a generic sans-serif font. (default: Roboto)"
    });
    await SETTINGS.registerSetting('mainBackground', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Background color',
      description: "Main background color of the panel. (default: Note list background color)"
    });
    await SETTINGS.registerSetting('mainForeground', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Foreground color',
      description: "Default foreground color used for text and icons. (default: App faded color)"
    });
    await SETTINGS.registerSetting('dividerColor', {
      value: SettingDefaults.Default,
      type: SettingItemType.String,
      section: 'favorites.settings',
      public: true,
      advanced: true,
      label: 'Divider color',
      description: "Color of the divider between the favorites. (default: App divider/border color)"
    });

    //#endregion

    //#region INITIALIZATION

    let favorites = new Favorites();
    await favorites.read();

    //#endregion

    //#region COMMANDS

    async function getSettingOrDefault(setting: string, defaultValue: string): Promise<string> {
      const value: string = await SETTINGS.value(setting);
      if (value.match(new RegExp(SettingDefaults.Default, "i"))) {
        return defaultValue;
      } else {
        return value;
      }
    }

    async function checkAndRemoveFavorite(value: string, dataType: string): Promise<boolean> {
      const item = await DATA.get([dataType, value], { fields: ['id'] });
      if (item) return false;

      await favorites.delete(value);
      return true;
    }

    async function openFavorite(value: string) {
      const favorite: any = await favorites.get(value);
      if (!favorite) return;

      switch (favorite.type) {
        case FavoriteType.Folder:
          if (await checkAndRemoveFavorite(value, 'folders')) return;
          COMMANDS.execute('openFolder', value);
          break;

        case FavoriteType.Note:
        case FavoriteType.Todo:
          if (await checkAndRemoveFavorite(value, 'notes')) return;
          COMMANDS.execute('openNote', value);
          break;

        case FavoriteType.Tag:
          if (await checkAndRemoveFavorite(value, 'tags')) return;
          COMMANDS.execute('openTag', value);
          break;

        case FavoriteType.Search:
          // TODO how to open searches?
          break;
        default:
          break;
      }
    }

    async function addFavorite(value: string, defaultTitle: string, type: FavoriteType, showUserInput: boolean = true) {
      let title: string = defaultTitle;

      if (showUserInput) {
        await DIALOGS.setHtml(userInput, `
          <div>
            <h3><span class="fas ${FavoriteDesc[type].icon}"></span> Add ${FavoriteDesc[type].name} to favorites</h3>
            <form name="inputForm">
              <input type="text" id="title" name="title" value="${title}">
            </form>
          </div>
        `);
        const result: any = await DIALOGS.open(userInput);
        if (result.id == "ok" && result.formData != null && result.formData.inputForm.title != '') {
          title = result.formData.inputForm.title;
        } else {
          return;
        }
      }

      await favorites.add(value, title, type);
      await updatePanelView();
    }

    async function editFavorite(value: string, showUserInput: boolean = true) {
      const favorite: any = await favorites.get(value);
      if (!favorite) return;

      if (showUserInput) {
        await DIALOGS.setHtml(userInput, `
          <div>
            <h3><span class="fas fa-edit"></span> Edit ${FavoriteDesc[favorite.type].name} favorite</h3>
            <form name="inputForm">
              <input type="text" id="title" name="title" value="${favorite.title}">
            </form>
          </div>
        `);
        await DIALOGS.setButtons(userInput, [
          {
            id: 'delete',
            title: 'Delete',
          },
          {
            id: 'ok',
            title: 'OK'
          },
          {
            id: 'cancel',
            title: 'Cancel'
          },
        ]);
        const result: any = await DIALOGS.open(userInput);
        if (result.id == "ok") {
          if (result.formData != null && result.formData.inputForm.title != '') {
            await favorites.rename(value, result.formData.inputForm.title);
            await updatePanelView();
          }
        } else if (result.id == "delete") {
          await favorites.delete(value);
          await updatePanelView();
        } else {
          return;
        }
      }
    }

    // Command: favsAddFolder
    // Desc: Add selected folder to favorites
    await COMMANDS.register({
      name: 'favsAddFolder',
      label: 'Favorites: Add notebook',
      iconName: 'fas fa-book',
      enabledCondition: 'oneFolderSelected',
      execute: async (folderId: string) => {
        if (folderId) {

          // return if selected folder has already a favorite
          if (favorites.hasFavorite(folderId)) return;

          // get concrete folder data
          const folder = await DATA.get(['folders', folderId], { fields: ['id', 'title'] });
          if (!folder) return;

          await addFavorite(folder.id, folder.title, FavoriteType.Folder);
        } else {
          const selectedFolder: any = await WORKSPACE.selectedFolder();
          if (!selectedFolder) return;

          // return if selected folder has already a favorite
          if (favorites.hasFavorite(folderId)) return;

          await addFavorite(selectedFolder.id, selectedFolder.title, FavoriteType.Folder);
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
          for (const noteId of noteIds) {
            // continue with next one if for note id already a favorite exists
            if (favorites.hasFavorite(noteId)) continue;

            // get concrete note data
            const note = await DATA.get(['notes', noteId], { fields: ['id', 'title', 'is_todo'] });
            if (!note) return;

            // in case multiple notes are selected - add them directly without user interaction
            await addFavorite(note.id, note.title, note.is_todo ? FavoriteType.Todo : FavoriteType.Note, (noteIds.length == 1));
          }
        } else {

          // get selected note and return if empty
          const selectedNote: any = await WORKSPACE.selectedNote();
          if (!selectedNote) return;

          // return if selected note has already a favorite
          if (favorites.hasFavorite(selectedNote.id)) return;

          await addFavorite(selectedNote.id, selectedNote.title, selectedNote.is_todo ? FavoriteType.Todo : FavoriteType.Note);
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

          // return if selected tag has already a favorite
          if (favorites.hasFavorite(tagId)) return;

          // get concrete tag data
          const tag = await DATA.get(['tags', tagId], { fields: ['id', 'title'] });
          if (!tag) return;

          await addFavorite(tag.id, tag.title, FavoriteType.Tag);
        }
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

    // prepare Tools > Favorites menu
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
        commandName: "favsAddTag",
        label: 'Add selected tag'
      },
      // {
      //   commandName: "favsAddActiveSearch",
      //   label: 'Add current active search'
      // },
      // {
      //   commandName: "favsAddNewSearch",
      //   label: 'Add new search query'
      // },
      {
        commandName: "favsClear",
        label: 'Remove all favorites'
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

    //#region INPUT DIALOG

    // prepare dialog object
    const userInput = await DIALOGS.create('userInput');
    await DIALOGS.addScript(userInput, './assets/fontawesome/css/all.min.css');
    await DIALOGS.addScript(userInput, './webview_dialog.css');

    //#endregion

    //#region PANEL VIEW

    // prepare panel object
    const panel = await PANELS.create("favorites.panel");
    await PANELS.addScript(panel, './assets/fontawesome/css/all.min.css');
    await PANELS.addScript(panel, './webview.css');
    await PANELS.addScript(panel, './webview.js');
    await PANELS.onMessage(panel, async (message: any) => {
      if (message.name === 'favsOpen') {
        openFavorite(message.id);
      }
      if (message.name === 'favsEdit') {
        editFavorite(message.id);
      }
      if (message.name === 'favsDrag') {
        await favorites.moveWithValue(message.sourceId, message.targetId);
        await updatePanelView();
      }
    });

    // set init message
    const font: string = await getSettingOrDefault('fontFamily', SettingDefaults.Font);
    const mainBg: string = await getSettingOrDefault('mainBackground', SettingDefaults.Background);
    await PANELS.setHtml(panel, `
      <div id="container" style="background:${mainBg};font-family:'${font}',sans-serif;">
        <div id="container-inner">
          <p style="padding-left:8px;">Loading panel...</p>
        </div>
      </div>
    `);

    // update HTML content
    async function updatePanelView() {
      const favsHtml: any = [];

      // get style values from settings
      const enableDragAndDrop: boolean = await SETTINGS.value('enableDragAndDrop');
      const showTypeIcons: boolean = await SETTINGS.value('showTypeIcons');
      const lineHeight: number = await SETTINGS.value('lineHeight');
      const minWidth: number = await SETTINGS.value('minFavoriteWidth');
      const maxWidth: number = await SETTINGS.value('maxFavoriteWidth');
      const background: string = await getSettingOrDefault('mainBackground', SettingDefaults.Background);
      const foreground: string = await getSettingOrDefault('mainForeground', SettingDefaults.Foreground);
      const dividerColor: string = await getSettingOrDefault('dividerColor', SettingDefaults.DividerColor);

      // create HTML for each favorite
      for (const favorite of favorites.getAll()) {

        // prepare type icon if enabled
        const typeIconHtml: string = showTypeIcons ? `<span class="fas ${FavoriteDesc[favorite.type].icon}" style="color:${foreground};"></span>` : '';

        favsHtml.push(`
          <div id="favorite" data-id="${favorite.value}"
              draggable="${enableDragAndDrop}" ondragstart="dragStart(event);" ondragend="dragEnd(event);" ondragover="dragOver(event);" ondragleave="dragLeave(event);" ondrop="drop(event);"
              style="height:${lineHeight}px;min-width:${minWidth}px;max-width:${maxWidth}px;background:${background};color:${foreground};">
            <div id="favorite-inner" style="border-color:${dividerColor};" data-id="${favorite.value}">
              ${typeIconHtml}
              <span class="favorite-title" data-id="${favorite.value}" title="${favorite.title}">
                ${favorite.title}
              </span>
            </div>
          </div>
        `);
      }
      // TODO re-add hoover icons
      // TODO bei hover werden beide icons angezeigt (sonst disabled)
      //   <div id="favorite-controls">
      //   <a href="#" id="editFavorite" class="fas fa-edit" title="Edit" data-id="${favorite.value}" style="color:${foreground};">
      //   <a href="#" id="removeFavorite" class="fas fa-times" title="Remove" data-id="${favorite.value}" style="color:${foreground};">
      // </div>

      // add entries to container and push to panel
      await PANELS.setHtml(panel, `
        <div id="container" style="background:${background};font-family:'${font}',sans-serif;">
          <div id="container-inner">
            ${favsHtml.join('\n')}
          </div>
        </div>
      `);
    }

    //#endregion

    //#region MAP EVENTS

    // TODO check if necessary - otherwise remove
    // TODO if onSettingChange is implemented this might be removed
    WORKSPACE.onNoteSelectionChange(async () => {
      await updatePanelView();
    });

    // WORKSPACE.onNoteChange(async () => {
    //   await updatePanelView();
    // });

    // WORKSPACE.onSyncComplete(async () => {
    //   await updatePanelView();
    // });

    //#endregion

    await updatePanelView();
  },
});
