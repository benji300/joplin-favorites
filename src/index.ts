import joplin from 'api';
import { MenuItem, MenuItemLocation } from 'api/types';

// stores the last opened but unpinned note
// var lastOpenedNote: any;

joplin.plugins.register({
	onStart: async function () {
		// TODO: remove what not used
		const COMMANDS = joplin.commands;
		const DATA = joplin.data;
		const PANELS = joplin.views.panels;
		const SETTINGS = joplin.settings;
		const WORKSPACE = joplin.workspace;

		//#region COMMAND HELPER FUNCTIONS

		function getIndexWithAttr(array: any, attr: any, value: any): number {
			for (var i: number = 0; i < array.length; i += 1) {
				if (array[i][attr] === value) {
					return i;
				}
			}
			return -1;
		}

		async function openFavorite(message: any) {
			console.info(`openFavorite: ${message}`); // TODO remove

			if (message.type == 'folder') {
				COMMANDS.execute('openFolder', message.value);
			}
			if (message.type == 'note') {
				COMMANDS.execute('openNote', message.value);
			}
			// TODO wie search öffnen?
		}

		async function editFavorite(message: any) {
			console.info(`editFavorite: ${message}`); // TODO remove

			// TODO
			// öffnet dialog zum ändern des names und des Wertes 
			// wertes label entweder als Id oder Query anzeigen
		}

		async function removeFavorite(message: any) {
			console.info(`removeFavorite: ${message}`); // TODO remove

			// TODO
		}

		async function addFolder(folderId: string) {
			console.info(`addFolder: ${folderId}`); // TODO remove

			// check if folder is not already favorite, otherwise return
			const favorites: any = await SETTINGS.value('favorites');
			const index: number = getIndexWithAttr(favorites, 'id', folderId);
			if (index != -1) return;

			// ask user for name (if cancelled, used default name)
			// TODO get folder from data
			const title: string = '';

			//   {
			//     "type": "folder"
			//     "title": "user defined name"
			//     "value": "folder id"
			//   }
			// add folder to favorites
			favorites.push({ type: 'folder', title: title, value: folderId });
			SETTINGS.setValue('favorites', favorites);

			console.info(`favorites: ${JSON.stringify(favorites)}`); // TODO remove
		}

		async function addNote(noteId: string) {
			console.info(`addFolder: ${noteId}`); // TODO remove

			// TODO
		}

		async function addSearch(query: string) {
			console.info(`addSearch: ${query}`); // TODO remove

			// TODO
		}

		// // Remove note with handled id from pinned notes array
		// async function unpinNote(noteId: string) {
		// 	// check if note is pinned, otherwise return
		// 	const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
		// 	const index: number = getIndexWithAttr(pinnedNotes, 'id', noteId);
		// 	if (index == -1) return;

		// 	// unpin handled note
		// 	pinnedNotes.splice(index, 1);
		// 	SETTINGS.setValue('pinnedNotes', pinnedNotes);
		// }

		//#endregion

		//#region REGISTER USER OPTIONS

		await SETTINGS.registerSection('com.benji300.joplin.favorites.settings', {
			label: 'Favorites',
			iconName: 'fas fa-star',
		});

		// [
		//   {
		//     "type": "folder | note | search"
		//     "title": "user defined name"
		//     "value": "folder id | note id | search query"
		//   }
		// ]
		await SETTINGS.registerSetting('favorites', {
			value: [],
			type: 4,
			section: 'com.benji300.joplin.tabs.settings',
			public: false,
			label: 'Favorites'
		});

		// General settings
		await SETTINGS.registerSetting('lineHeight', {
			value: "40",
			type: 1,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Favorites line height (px)',
			description: 'Line height of the favorites panel.'
		});
		await SETTINGS.registerSetting('maxEntryWidth', {
			value: "150",
			type: 1,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Maximum entry width (px)',
			description: 'Maximum of one favorite entry in pixel.'
		});

		// Advanced styles
		await SETTINGS.registerSetting('mainBackground', {
			value: "var(--joplin-background-color3)",
			type: 2,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Background color'
		});
		await SETTINGS.registerSetting('mainForeground', {
			value: "var(--joplin-color-faded)",
			type: 2,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Foreground color'
		});

		//#endregion

		//#region REGISTER COMMANDS

		await COMMANDS.register({
			name: 'favsAddFolder',
			label: 'Favorites: Add current notebook',
			iconName: 'fas fa-folder-plus',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				try {
					// get the selected note and exit if none is currently selected
					const selectedNote: any = await WORKSPACE.selectedNote();
					if (!selectedNote) return;

					// add parent folder of selected note and update panel
					addFolder(selectedNote.parent_id);
					updatePanel();
				}
				catch (e) {
					alert('Something went wrong... cannot add current notebook to favorites.');
				}
			}
		});

		// // Command: tabsUnpinNote
		// // Desc: Unpin the selected note from the tabs
		// await COMMANDS.register({
		// 	name: 'tabsUnpinNote',
		// 	label: 'Tabs: Unpin note',
		// 	iconName: 'fas fa-times',
		// 	enabledCondition: "oneNoteSelected",
		// 	execute: async () => {
		// 		// get the selected note and exit if none is currently selected
		// 		const selectedNote: any = await WORKSPACE.selectedNote();
		// 		if (!selectedNote) return;

		// 		// unpin selected note and update panel
		// 		unpinNote(selectedNote.id);
		// 		updatePanelHtml();
		// 	}
		// });

		// // Command: tabsMoveLeft
		// // Desc: Move active (unpinned) tab to left
		// await COMMANDS.register({
		// 	name: 'tabsMoveLeft',
		// 	label: 'Tabs: Move tab left',
		// 	iconName: 'fas fa-chevron-left',
		// 	enabledCondition: "oneNoteSelected",
		// 	execute: async () => {
		// 		const selectedNote: any = await joplin.workspace.selectedNote();
		// 		if (!selectedNote) return;

		// 		// check if note is pinned and not already first, otherwise exit
		// 		const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
		// 		const index: number = getIndexWithAttr(pinnedNotes, 'id', selectedNote.id);
		// 		if (index == -1) return;
		// 		if (index == 0) return;

		// 		// change position of tab and update panel
		// 		pinnedNotes.splice(index, 1);
		// 		pinnedNotes.splice(index - 1, 0, selectedNote);
		// 		SETTINGS.setValue('pinnedNotes', pinnedNotes);
		// 		updatePanelHtml();
		// 	}
		// });

		// // Command: tabsMoveRight
		// // Desc: Move active (unpinned) tab to right
		// await COMMANDS.register({
		// 	name: 'tabsMoveRight',
		// 	label: 'Tabs: Move tab right',
		// 	iconName: 'fas fa-chevron-right',
		// 	enabledCondition: "oneNoteSelected",
		// 	execute: async () => {
		// 		const selectedNote: any = await joplin.workspace.selectedNote();
		// 		if (!selectedNote) return;

		// 		// check if note is pinned and not already first, otherwise exit
		// 		const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
		// 		const index: number = getIndexWithAttr(pinnedNotes, 'id', selectedNote.id);
		// 		if (index == -1) return;
		// 		if (index == pinnedNotes.length - 1) return;

		// 		// change position of tab and update panel
		// 		pinnedNotes.splice(index, 1);
		// 		pinnedNotes.splice(index + 1, 0, selectedNote);
		// 		SETTINGS.setValue('pinnedNotes', pinnedNotes);
		// 		updateTabsPanel();
		// 	}
		// });

		await COMMANDS.register({
			name: 'favsClear',
			label: 'Favorites: Clear all favorites',
			iconName: 'fas fa-times',
			execute: async () => {
				const favorites: any = [];
				SETTINGS.setValue('favorites', favorites);
				updatePanel();
			}
		});

		//#endregion

		//#region SETUP PANEL

		// prepare panel object
		const panel = await PANELS.create("com.benji300.joplin.favorites.panel");
		await PANELS.addScript(panel, './fontawesome/css/all.min.css');
		await PANELS.addScript(panel, './webview.css');
		await PANELS.addScript(panel, './webview.js');
		PANELS.onMessage(panel, (message: any) => {
			if (message.name === 'openFavorite') {
				openFavorite(message);
			}
			if (message.name === 'editFavorite') {
				editFavorite(message);
				updatePanel();
			}
			if (message.name === 'removeFavorite') {
				removeFavorite(message);
				updatePanel();
			}
			if (message.name === 'favsAddFolder') {
				COMMANDS.execute('favsAddFolder');
			}
			if (message.name === 'favsAddNote') {
				COMMANDS.execute('favsAddNote');
			}
			// TODO
			// if (message.name === 'tabsUnpinNote') {
			// 	unpinNote(message.id);
			// 	updateTabsPanel();
			// }
			// if (message.name === 'tabsToggleTodo') {
			// 	toggleTodo(message.id, message.checked);
			// 	updateTabsPanel();
			// }
			// if (message.name === 'tabsMoveLeft') {
			// 	COMMANDS.execute('tabsMoveLeft');
			// }
			// if (message.name === 'tabsMoveRight') {
			// 	COMMANDS.execute('tabsMoveRight');
			// }
		});

		// prepare single favorite HTML
		async function prepareFavHtml(favorite: any): Promise<string> {
			// get style values from settings
			const height: number = await SETTINGS.value('lineHeight');
			const maxWidth: number = await SETTINGS.value('maxEntryWidth');
			const mainBg: string = await SETTINGS.value('mainBackground');
			const mainFg: string = await SETTINGS.value('mainForeground');

			// prepare style attributes

			// TODO bei hover werden beide icons angezeigt (sonst disabled)
			const html = `
				<div class="favorite" style="height:${height}px;max-width:${maxWidth}px;background:${mainBg};">
					<div class="favorite-inner" data-type="${favorite.type}" data-title="${favorite.title}" data-value="${favorite.value}">
						<span class="title" data-type="${favorite.type}" data-title="${favorite.title}" data-value="${favorite.value}" style="color:${mainFg};">
							${favorite.title}
						</span>
						<div class="favorite-icons">
							<a href="#" id="editFavorite" class="fas fa-edit" title="Edit" data-type="${favorite.type}" data-title="${favorite.title}" data-value="${favorite.value}" style="color:${mainFg};">
							<a href="#" id="removeFavorite" class="fas fa-times" title="Remove" data-type="${favorite.type}" data-title="${favorite.title}" data-value="${favorite.value}" style="color:${mainFg};">
						</div>
					</div>
				</div>
			`;
			return html;
		}

		// update HTML content
		async function updatePanel() {
			const favsHtml: any = [];
			const selectedNote: any = await joplin.workspace.selectedNote();

			// add all favorites to HTML
			const favorites: any = await SETTINGS.value('favorites');
			for (const favorite of favorites) {
				// if (selectedNote && favorite.id == selectedNote.id) {
				// 	// selectedNoteIsNew = false;
				// }

				// check if favorite's folder or note id still exists - otherwise remove and continue with next one
				// TODO

				// // check if note id still exists - otherwise remove from pinned notes and continue with next one
				// var note: any = null; // representation of the real note data
				// try {
				// 	note = await DATA.get(['notes', favorite.id], { fields: ['id', 'title', 'is_todo', 'todo_completed'] });
				// } catch (error) {
				// 	unpinNote(favorite.id);
				// 	continue;
				// }

				// check if note is pinned and completed, then unpin it if enabled and continue with next one
				// const unpinCompleted: boolean = await SETTINGS.value('unpinCompletedTodos');
				// if (unpinCompleted && note.is_todo && note.todo_completed) {
				// 	unpinNote(note.id);
				// 	continue;
				// }

				favsHtml.push((await prepareFavHtml(favorite)).toString());
			}

			// check whether selected note is not pinned but active - than set as lastOpenedNote
			// if (selectedNote) {
			// 	if (selectedNoteIsNew) {
			// 		lastOpenedNote = selectedNote;
			// 	} else {
			// 		// if note is already pinned but also still last opened - clear last opened
			// 		if (lastOpenedNote && lastOpenedNote.id == selectedNote.id) {
			// 			lastOpenedNote = null;
			// 		}
			// 	}
			// }

			// // check whether last opened note still exists - clear if not
			// if (lastOpenedNote) {
			// 	try {
			// 		note = await DATA.get(['notes', lastOpenedNote.id], { fields: ['id'] });
			// 	} catch (error) {
			// 		lastOpenedNote = null;
			// 	}
			// }

			// // add last opened or current selected note at last (unpinned)
			// if (lastOpenedNote) {
			// 	favsHtml.push((await prepareTabHtml(lastOpenedNote, selectedNote, false)).toString());
			// }

			// get setting style values
			const height: number = await SETTINGS.value('lineHeight');
			const mainBg: string = await SETTINGS.value('mainBackground');
			const mainFg: string = await SETTINGS.value('mainForeground');

			// add entries to container and push to panel
			await PANELS.setHtml(panel, `
					<div class="container" style="background:${mainBg};">
						<div class="favorites-container">
							${favsHtml.join('\n')}
							<div class="controls" style="height:${height}px;">
								<a href="#" id="addFolder" class="fas fa-folder-plus" title="Add current notebook to favorites" style="color:${mainFg};"></a>
								<a href="#" id="addNote" class="fas fa-file-medical" title="Add selected note to favorites" style="color:${mainFg};"></a>
								<a href="#" id="addSearch" class="fas fa-search-plus" title="Add current search to favorites" style="color:${mainFg};"></a>
							</div>
						</div>
					</div>
				`);
		}

		//#endregion

		//#region MAP COMMANDS TO MENU

		const favoritesCommandsSubMenu: MenuItem[] = [
			{
				commandName: "favsAddFolder",
				label: 'Add current Notebook'
			},
			{
				commandName: "favsAddNote",
				label: 'Add selected Note'
			},
			{
				commandName: "favsAddActiveSearch",
				label: 'Add active search'
			},
			{
				commandName: "favsAddNewSearch",
				label: 'Add new search'
			},
			// {
			// 	commandName: "favsMoveLeft",
			// 	label: 'Move favorite left'
			// },
			// {
			// 	commandName: "favsMoveRight",
			// 	label: 'Move favorite right'
			// },
			// {
			// 	commandName: "favsRemoveEntry",
			// 	label: 'Remove from favorites'
			// },
			{
				commandName: "favsClear",
				label: 'Clear all favorites'
			}
		]
		await joplin.views.menus.create('menuToolsFavorites', 'Favorites', favoritesCommandsSubMenu, MenuItemLocation.Tools);

		// TODO map favsAddNote to context menu (needs to handle input params then!)

		//#endregion

		//#region MAP INTERNAL EVENTS

		WORKSPACE.onNoteSelectionChange(() => {
			updatePanel();
		});

		WORKSPACE.onNoteContentChange(() => {
			updatePanel();
		});

		WORKSPACE.onSyncComplete(() => {
			updatePanel();
		});

		//#endregion

		updatePanel();
	},
});
