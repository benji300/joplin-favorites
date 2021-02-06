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
   * Gets the favorites with the handled value. Null if not exist.
   */
  get(value: string): any {
    if (value === undefined) return;

    for (let i: number = 0; i < this.length; i++) {
      if (this._store[i]['value'] === value) return this._store[i];
    }
    return null;
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
  async add(newValue: string, newTitle: string, newType: FavoriteType, targetId?: string) {
    if (newValue === undefined || newTitle === undefined || newType === undefined) return;

    const newFavorite = { value: newValue, title: newTitle, type: newType };
    if (targetId) {
      await this.insertAtIndex(this.indexOf(targetId), newFavorite);
    } else {
      this._store.push(newFavorite);
    }
  }

  /**
   * Changes the title of the handled favorite.
   */
  async changeValue(value: string, newValue: string) {
    if (!newValue) return;
    const index: number = this.indexOf(value);
    if (index < 0) return;
    this._store[index].value = newValue;
  }

  /**
   * Changes the title of the handled favorite.
   */
  async changeTitle(value: string, newTitle: string) {
    if (!newTitle) return;
    const index: number = this.indexOf(value);
    if (index < 0) return;
    this._store[index].title = newTitle;
  }

  /**
   * Changes the type of the handled favorite.
   */
  async changeType(value: string, newType: FavoriteType) {
    const index: number = this.indexOf(value);
    if (index < 0) return;

    this._store[index].type = newType;
  }

  /**
   * Moves the favorite from source index to the target index.
   */
  async moveWithIndex(sourceIdx: number, targetIdx: number) {
    if (this.indexOutOfBounds(sourceIdx)) return;
    if (this.indexOutOfBounds(targetIdx)) return;

    const favorite: any = this._store[sourceIdx];
    this._store.splice(sourceIdx, 1);
    this._store.splice((targetIdx == 0 ? 0 : targetIdx), 0, favorite);
  }

  /**
   * Moves the source favorite to the index of the target favorite.
   */
  async moveWithValue(sourceValue: string, targetValue: string) {
    const targetIdx: number = (targetValue) ? this.indexOf(targetValue) : (this.length - 1);
    await this.moveWithIndex(this.indexOf(sourceValue), targetIdx);
  }

  /**
   * Removes favorite with handled value.
   */
  async delete(value: string) {
    const index = this.indexOf(value);
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
