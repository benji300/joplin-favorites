import joplin from 'api';
import { MenuItem, MenuItemLocation } from 'api/types';
import { ChangeEvent } from 'api/JoplinSettings';
import { FavoriteType, IFavorite, FavoriteDesc, Favorites } from './favorites';
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
    const favorites = new Favorites(settings);
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
    async function checkAndRemoveFavorite(favorite: IFavorite, index: number): Promise<boolean> {
      try {
        await DATA.get([FavoriteDesc[favorite.type].dataType, favorite.value], { fields: ['id'] });
      } catch (err) {
        const result: number = await Dialog.showMessage(`Cannot open favorite. Seems that the target ${FavoriteDesc[favorite.type].name.toLocaleLowerCase()} was deleted.\n\nDo you want to delete the favorite also?`);
        if (!result) {
          await favorites.delete(index);
          await panel.updateWebview();
          return true;
        }
      }
      return false;
    }

    /**
     * Check if note/todo is still of the same type - otherwise change type
     */
    async function checkAndUpdateType(favorite: IFavorite, index: number) {
      let newType: FavoriteType;
      const note: any = await DATA.get([FavoriteDesc[favorite.type].dataType, favorite.value], { fields: ['id', 'is_todo'] });
      if (favorite.type === FavoriteType.Note && note.is_todo) newType = FavoriteType.Todo;
      if (favorite.type === FavoriteType.Todo && (!note.is_todo)) newType = FavoriteType.Note;
      if (newType) {
        await favorites.changeType(index, newType);
        await panel.updateWebview();
      }
    }

    /**
     * Add new favorite entry
     */
    async function addFavorite(value: string, title: string, type: FavoriteType, showDialog: boolean, targetIdx?: number) {
      let newValue: string = value;
      let newTitle: string = title;

      // check whether a favorite with handled value already exists
      const index: number = favorites.indexOf(value);
      if (index >= 0) {

        // if so... open editFavorite dialog
        await COMMANDS.execute('favsEditFavorite', index);
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

        await favorites.add(newValue, newTitle, type, targetIdx);
        await panel.updateWebview();
      }
    }

    //#endregion

    //#region COMMANDS

    // Command: favsOpenFavorite (INTERNAL)
    // Desc: Internal command to open a favorite
    await COMMANDS.register({
      name: 'favsOpenFavorite',
      execute: async (index: number) => {
        const favorite: IFavorite = favorites.get(index);
        if (!favorite) return;

        switch (favorite.type) {
          case FavoriteType.Folder:
            if (await checkAndRemoveFavorite(favorite, index)) return;
            COMMANDS.execute('openFolder', favorite.value);
            break;

          case FavoriteType.Note:
          case FavoriteType.Todo:
            if (await checkAndRemoveFavorite(favorite, index)) return;
            await checkAndUpdateType(favorite, index);
            COMMANDS.execute('openNote', favorite.value);
            break;

          case FavoriteType.Tag:
            if (await checkAndRemoveFavorite(favorite, index)) return;
            COMMANDS.execute('openTag', favorite.value);
            break;

          case FavoriteType.Search:
            // TODO there is a command `~\app-desktop\gui\MainScreen\commands\search.ts` avaiable, but currently empty
            // use this once it is implemented

            // currently there's no command to trigger a global search, so the following workaround is used
            // 1. copy saved search to clipboard
            const copy = require('../node_modules/copy-to-clipboard');
            copy(favorites.getDecodedValue(favorite));
            // 2. focus global search bar via command
            await COMMANDS.execute('focusSearch');
            // 3. paste clipboard content to current cursor position (should be search bar now)
            // TODO how?
            break;

          default:
            break;
        }

        await panel.updateWebview();
      }
    });

    // Command: favsEditFavorite (INTERNAL)
    // Desc: Internal command to edit a favorite
    await COMMANDS.register({
      name: 'favsEditFavorite',
      execute: async (index: number) => {
        const favorite: IFavorite = favorites.get(index);
        if (!favorite) return;

        // open dialog and handle result
        const result: any = await editDialog.open(favorite.value, favorite.title, favorite.type);
        if (result.id == "ok" && result.formData != null) {
          await favorites.changeTitle(index, result.formData.inputForm.title);
          await favorites.changeValue(index, result.formData.inputForm.value);
        } else if (result.id == "delete") {
          await favorites.delete(index);
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
      label: 'Add notebook to Favorites',
      iconName: 'fas fa-book',
      enabledCondition: 'oneFolderSelected',
      execute: async (folderId: string, targetIdx?: number) => {
        if (folderId) {
          const folder = await DATA.get(['folders', folderId], { fields: ['id', 'title'] });
          if (!folder) return;

          await addFavorite(folder.id, folder.title, FavoriteType.Folder, settings.editBeforeAdd, targetIdx);
        } else {
          const selectedFolder: any = await WORKSPACE.selectedFolder();
          if (!selectedFolder) return;

          await addFavorite(selectedFolder.id, selectedFolder.title, FavoriteType.Folder, settings.editBeforeAdd, targetIdx);
        }
      }
    });

    // Command: favsAddNote
    // Desc: Add selected note to favorites
    await COMMANDS.register({
      name: 'favsAddNote',
      label: 'Add note to Favorites',
      iconName: 'fas fa-sticky-note',
      enabledCondition: "someNotesSelected",
      execute: async (noteIds: string[], targetIdx?: number) => {
        if (noteIds) {

          // in case multiple notes are selected - add them directly without user interaction
          for (const noteId of noteIds) {
            if (noteIds.length > 1 && favorites.hasFavorite(noteId)) continue;

            const note = await DATA.get(['notes', noteId], { fields: ['id', 'title', 'is_todo'] });
            if (!note) return;

            // never show dialog for multiple notes
            const showDialog: boolean = (settings.editBeforeAdd && noteIds.length == 1);
            await addFavorite(note.id, note.title, note.is_todo ? FavoriteType.Todo : FavoriteType.Note, showDialog, targetIdx);
          }
        } else {
          const selectedNote: any = await WORKSPACE.selectedNote();
          if (!selectedNote) return;

          await addFavorite(selectedNote.id, selectedNote.title, selectedNote.is_todo ? FavoriteType.Todo : FavoriteType.Note, settings.editBeforeAdd, targetIdx);
        }
      }
    });

    // Command: favsAddTag
    // Desc: Add tag to favorites
    await COMMANDS.register({
      name: 'favsAddTag',
      label: 'Add tag to Favorites',
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
      label: 'Add new search to Favorites',
      iconName: 'fas fa-search',
      execute: async () => {
        await addFavorite('', 'New Search', FavoriteType.Search, true); // always add with dialog
      }
    });

    // Command: favsClear
    // Desc: Remove all favorites
    await COMMANDS.register({
      name: 'favsClear',
      label: 'Remove all Favorites',
      iconName: 'fas fa-times',
      execute: async () => {
        // ask user before removing favorites
        const result: number = await Dialog.showMessage('Do you really want to remove all Favorites?');
        if (result) return;

        await settings.clearFavorites();
        await panel.updateWebview();
      }
    });

    // Command: favsToggleVisibility
    // Desc: Toggle panel visibility
    await COMMANDS.register({
      name: 'favsToggleVisibility',
      label: 'Toggle Favorites panel visibility',
      iconName: 'fas fa-eye-slash',
      execute: async () => {
        await panel.toggleVisibility();
      }
    });

    // prepare commands menu
    const commandsSubMenu: MenuItem[] = [
      {
        commandName: 'favsAddFolder',
        label: 'Add active notebook'
      },
      {
        commandName: 'favsAddNote',
        label: 'Add selected note(s)'
      },
      {
        commandName: 'favsAddSearch',
        label: 'Add new search'
      },
      // {
      //   commandName: "favsAddActiveSearch",
      //   label: 'Add current active search'
      // },
      {
        commandName: 'favsClear',
        label: 'Remove all Favorites'
      },
      {
        commandName: 'favsToggleVisibility',
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

    // let onChangeCnt = 0;
    SETTINGS.onChange(async (event: ChangeEvent) => {
      // console.debug(`onChange() hits: ${onChangeCnt++}`);
      await settings.read(event);
      await panel.updateWebview();
    });

    //#endregion

    await panel.updateWebview();
  }
});
