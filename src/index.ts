import joplin from 'api';
import { MenuItem, MenuItemLocation, SettingItemType } from 'api/types';
import { FavoriteType, Favorites, SettingDefaults } from './helpers';

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
    await SETTINGS.registerSetting('lineHeight', {
      value: "40",
      type: SettingItemType.Int,
      section: 'favorites.settings',
      public: true,
      label: 'Favorites line height (px)',
      description: 'Line height of the favorites panel.'
    });
    await SETTINGS.registerSetting('maxFavoriteWidth', {
      value: "150",
      type: 1,
      section: 'favorites.settings',
      public: true,
      label: 'Maximum favorite width (px)',
      description: 'Maximum of one favorite in pixel.'
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

    async function openFavorite(value: string) {

      // get favorite from internal storage
      const favorite: any = await favorites.get(value);
      if (!favorite) return;

      if (favorite.type == FavoriteType.Folder) {
        // TODO check if entry still exists, otherwise ask user to remove it
        COMMANDS.execute('openFolder', value);
      }
      if (favorite.type == FavoriteType.Note || favorite.type == FavoriteType.Todo) {
        // TODO check if entry still exists, otherwise ask user to remove it
        COMMANDS.execute('openNote', value);
      }
      if (favorite.type == FavoriteType.Tag) {
        // TODO check if entry still exists, otherwise ask user to remove it
        COMMANDS.execute('openTag', value);
      }
      // TODO wie search öffnen?

      console.info(`openFavorite: ${JSON.stringify(favorite)}`); // TODO remove
    }

    async function addFavorite(value: string, defaultTitle: string, type: FavoriteType) {

      // TODO ask user for name (open dialog)
      // - if cancelled - return
      // - default = handled title
      favorites.add(value, defaultTitle, type);
      await updatePanelView();

      console.info(`favorites: ${JSON.stringify(favorites)}`); // TODO remove
    }

    async function editFavorite(value: string) {

      // get favorite from internal storage
      const favorite: any = await favorites.get(value);
      if (!favorite) return;

      // TODO
      // öffnet dialog zum ändern des names und des Wertes
      // wertes label entweder als Id oder Query anzeigen

      await updatePanelView();

      console.info(`editFavorite: ${JSON.stringify(favorites)}`); // TODO remove
    }

    async function removeFavorite(value: string) {
      await favorites.delete(favorites.indexOf(value));
      await updatePanelView();
    }

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

          // get selected folder and return if empty
          const selectedFolder: any = await WORKSPACE.selectedFolder();
          if (!selectedFolder) return;

          // return if selected folder has already a favorite
          if (favorites.hasFavorite(folderId)) return;

          await addFavorite(selectedFolder.id, selectedFolder.title, FavoriteType.Folder);
        }
      }
    });

    await COMMANDS.register({
      name: 'favsAddNote',
      label: 'Favorites: Add note',
      iconName: 'fas fa-sticky-note',
      enabledCondition: "oneNoteSelected",
      execute: async (noteIds: string[]) => {
        if (noteIds && noteIds.length == 1) {

          // return if selected note has already a favorite
          if (favorites.hasFavorite(noteIds[0])) return;

          // get concrete note data
          const note = await DATA.get(['notes', noteIds[0]], { fields: ['id', 'title', 'is_todo'] });
          if (!note) return;

          await addFavorite(note.id, note.title, note.is_todo ? FavoriteType.Todo : FavoriteType.Note);
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
      if (message.name === 'favsRemove') {
        removeFavorite(message.id);
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
      const lineHeight: number = await SETTINGS.value('lineHeight');
      const maxWidth: number = await SETTINGS.value('maxFavoriteWidth');
      const background: string = await getSettingOrDefault('mainBackground', SettingDefaults.Background);
      const foreground: string = await getSettingOrDefault('mainForeground', SettingDefaults.Foreground);
      const dividerColor: string = await getSettingOrDefault('dividerColor', SettingDefaults.DividerColor);

      // create HTML for each favorite
      for (const favorite of favorites.getAll()) {
        favsHtml.push(`
          <div id="favorite" data-id="${favorite.value}"
              draggable="${enableDragAndDrop}" ondragstart="dragStart(event);" ondragend="dragEnd(event);" ondragover="dragOver(event);" ondragleave="dragLeave(event);" ondrop="drop(event);"
              style="height:${lineHeight}px;max-width:${maxWidth}px;background:${background};">
            <div id="favorite-inner" style="border-color:${dividerColor};" data-id="${favorite.value}">
              <span class="favorite-title" data-id="${favorite.value}" style="color:${foreground};" title="${favorite.title}">
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
    // WORKSPACE.onNoteSelectionChange(async () => {
    //   await updatePanelView();
    // });

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
