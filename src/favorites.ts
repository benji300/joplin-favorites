/**
 * Favorite type definitions.
 */
export enum FavoriteType {
  Folder = 0,
  Note = 1,
  Todo = 2,
  Tag = 3,
  Search = 4
}

/**
 * Definition of the favorite descriptions.
 */
interface IFavoriteDesc {
  name: string,
  icon: string,
  dataType: string,
  label: string
}

/**
 * Array of favorite descriptions. Order must match with FavoriteType enum.
 */
export const FavoriteDesc: IFavoriteDesc[] = [
  { name: 'Notebook', icon: 'fa-book', dataType: 'folders', label: 'Full path' }, // Folder
  { name: 'Note', icon: 'fa-file-alt', dataType: 'notes', label: 'Full path' }, // Note
  { name: 'To-do', icon: 'fa-check-square', dataType: 'notes', label: 'Full path' }, // Todo
  { name: 'Tag', icon: 'fa-tag', dataType: 'tags', label: 'Tag' }, // Tag
  { name: 'Search', icon: 'fa-search', dataType: 'searches', label: 'Search query' } // Search
];

/**
 * Helper class to work with favorites array.
 * - Read settings array once at startup.
 * - Then work on this._tabs array.
 */
export class Favorites {
  /**
   * Temporary array to work with favorites.
   * 
   * Definition of one favorite entry:
   * [{
   *   "value": "folderId|noteId|tagId|searchQuery",
   *   "title": "userConfiguredTitle",
   *   "type": FavoriteType
   * }]
   */
  private _store: any[];

  /**
   * Init with stored values from settings array.
   */
  constructor(settingsArray: any[]) {
    this._store = settingsArray;
  }

  //#region  GETTER

  /**
   * All entries.
   */
  get all(): any[] {
    return this._store;
  }

  /**
   * Number of entries.
   */
  get length(): number {
    return this._store.length;
  }

  //#endregion

  /**
   * Inserts handled favorite at specified index.
   */
  private async insertAtIndex(index: number, favorite: any) {
    if (index < 0 || favorite === undefined) return;

    this._store.splice(index, 0, favorite);
  }

  /**
   * Gets a value whether the handled index would lead to out of bound access.
   */
  private indexOutOfBounds(index: number): boolean {
    return (index < 0 || index >= this.length);
  }

  /**
   * Escapes HTML special characters.
   * From https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins/toc/src/index.ts
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .trim();
  }

  /**
   * Gets the favorites with the handled value. Null if not exist.
   */
  get(index: number): any {
    if (this.indexOutOfBounds(index)) return;
    return this._store[index];
  }

  /**
   * Gets index of favorite with handled value. -1 if not exist.
   */
  indexOf(value: string): number {
    if (value) {
      for (let i: number = 0; i < this.length; i++) {
        if (this._store[i]['value'] === value) return i;
      }
    }
    return -1;
  }

  /**
   * Gets a value whether a favorite with the handled value exists or not.
   */
  hasFavorite(value: string): boolean {
    return this.indexOf(value) < 0 ? false : true;
  }

  /**
   * Adds note as new favorite at the handled index or at the end.
   */
  async add(newValue: string, newTitle: string, newType: FavoriteType, targetIdx?: number) {
    if (newValue === undefined || newTitle === undefined || newType === undefined) return;

    const newFavorite = { value: this.escapeHtml(newValue), title: this.escapeHtml(newTitle), type: newType };
    if (targetIdx) {
      await this.insertAtIndex(targetIdx, newFavorite);
    } else {
      this._store.push(newFavorite);
    }
  }

  /**
   * Changes the title of the handled favorite.
   */
  async changeValue(index: number, newValue: string) {
    if (index < 0 || newValue === undefined || newValue === '') return;
    this._store[index].value = this.escapeHtml(newValue);
  }

  /**
   * Changes the title of the handled favorite.
   */
  async changeTitle(index: number, newTitle: string) {
    if (index < 0 || newTitle === undefined || newTitle === '') return;
    this._store[index].title = this.escapeHtml(newTitle);
  }

  /**
   * Changes the type of the handled favorite.
   */
  async changeType(index: number, newType: FavoriteType) {
    if (index < 0 || newType === undefined) return;
    this._store[index].type = newType;
  }

  /**
   * Moves the favorite from source index to the target index.
   */
  async moveWithIndex(sourceIdx: number, targetIdx?: number) {
    if (this.indexOutOfBounds(sourceIdx)) return;
    if (targetIdx && this.indexOutOfBounds(targetIdx)) return;

    // undefined targetIdx => move to the end
    let target: number = this.length - 1;
    if (targetIdx) {
      // else move at desired index
      target = targetIdx;
    }
    const favorite: any = this._store[sourceIdx];
    this._store.splice(sourceIdx, 1);
    this._store.splice(target, 0, favorite);
  }

  /**
   * Removes favorite with handled index.
   */
  async delete(index: number) {
    if (index >= 0) {
      this._store.splice(index, 1);
    }
  }

  /**
   * Clears the stored array.
   */
  async clearAll() {
    this._store = [];
  }
}
