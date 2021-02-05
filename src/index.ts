import joplin from 'api';
import { MenuItem, MenuItemLocation } from 'api/types';
import { ChangeEvent } from 'api/JoplinSettings';
import { FavoriteType, FavoriteDesc, Favorites } from './favorites';
import { Settings } from './settings';
import { Panel } from './panel';
import { Dialog } from './dialog';

joplin.plugins.register({
  onStart: async function () {
    const COMMANDS = joplin.commands;
    const DATA = joplin.data;
    const SETTINGS = joplin.settings;
    const WORKSPACE = joplin.workspace;
    // settings
    const settings: Settings = new Settings();
    await settings.register();
    // favorites
    const favorites = new Favorites(settings.favorites);
    // panel
    const panel = new Panel(favorites, settings);
    await panel.register();
    // dialogs
    const addDialog = new Dialog('Add');
    await addDialog.register();
    const editDialog = new Dialog('Edit');
    await editDialog.register([
      { id: 'delete', title: 'Delete', },
      { id: 'ok', title: 'OK' },
      { id: 'cancel', title: 'Cancel' }
    ]);

    //#region HELPERS

    /**
      * Check if favorite target still exists - otherwise ask to remove favorite
      */
    async function checkAndRemoveFavorite(favorite: any): Promise<boolean> {
      try {
        await DATA.get([FavoriteDesc[favorite.type].dataType, favorite.value], { fields: ['id'] });
      } catch (err) {
        const result: number = await Dialog.showMessage(`Cannot open favorite. Seems that the target ${FavoriteDesc[favorite.type].name.toLocaleLowerCase()} was deleted.\n\nDo you want to delete the favorite also?`);
        if (!result) {
          await favorites.delete(favorite.value);
          await panel.updateWebview();
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
        await panel.updateWebview();
      }
    }

    async function addFavorite(value: string, title: string, type: FavoriteType, showDialog: boolean) {
      let newValue: string = value;
      let newTitle: string = title;

      // check whether a favorite with handled value already exists
      if (favorites.hasFavorite(value)) {

        // if so... open editFavorite dialog
        await COMMANDS.execute('favsEditFavorite', value);
      } else {

        // otherwise create new favorite, with or without user interaction
        if (showDialog) {

          // open dialog and handle result
          const result: any = await addDialog.open(value, newTitle, type);
          if (result.id == 'ok' && result.formData != null) {
            newTitle = result.formData.inputForm.title;
            if (result.formData.inputForm.value)
              newValue = result.formData.inputForm.value;
          } else
            return;
        }

        if (newValue === '' || newTitle === '') return;

        await favorites.add(newValue, newTitle, type);
        await panel.updateWebview();
      }
    }

    //#endregion

    //#region COMMANDS

    // Command: favsOpenFavorite (INTERNAL)
    // Desc: Internal command to open a favorite
    await COMMANDS.register({
      name: 'favsOpenFavorite',
      execute: async (value: string) => {
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
    });

    // Command: favsEditFavorite (INTERNAL)
    // Desc: Internal command to edit a favorite
    await COMMANDS.register({
      name: 'favsEditFavorite',
      execute: async (value: string) => {
        const favorite: any = await favorites.get(value);
        if (!favorite) return;

        // open dialog and handle result
        const result: any = await editDialog.open(favorite.value, favorite.title, favorite.type);
        if (result.id == "ok" && result.formData != null) {
          await favorites.changeTitle(value, result.formData.inputForm.title);
          await favorites.changeValue(value, result.formData.inputForm.value);
        } else if (result.id == "delete") {
          await favorites.delete(value);
        } else {
          return;
        }

        await panel.updateWebview();
      }
    });

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

          await addFavorite(folder.id, folder.title, FavoriteType.Folder, settings.editBeforeAdd);
        } else {
          const selectedFolder: any = await WORKSPACE.selectedFolder();
          if (!selectedFolder) return;

          await addFavorite(selectedFolder.id, selectedFolder.title, FavoriteType.Folder, settings.editBeforeAdd);
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
            const showDialog: boolean = (settings.editBeforeAdd && noteIds.length == 1);
            await addFavorite(note.id, note.title, note.is_todo ? FavoriteType.Todo : FavoriteType.Note, showDialog);
          }
        } else {
          const selectedNote: any = await WORKSPACE.selectedNote();
          if (!selectedNote) return;

          await addFavorite(selectedNote.id, selectedNote.title, selectedNote.is_todo ? FavoriteType.Todo : FavoriteType.Note, settings.editBeforeAdd);
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

          await addFavorite(tag.id, tag.title, FavoriteType.Tag, settings.editBeforeAdd);
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
        const result: number = await Dialog.showMessage(`Remove all favorites?`);
        if (result) return;

        await favorites.clearAll();
        await panel.updateWebview();
      }
    });

    // Command: favsToggleVisibility
    // Desc: Toggle panel visibility
    await COMMANDS.register({
      name: 'favsToggleVisibility',
      label: 'Favorites: Toggle visibility',
      iconName: 'fas fa-eye-slash',
      execute: async () => {
        await panel.toggleVisibility();
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

    //#region EVENTS

    SETTINGS.onChange(async (event: ChangeEvent) => {
      await settings.read(event);
      await panel.updateWebview();
    });

    //#endregion

  }
});
