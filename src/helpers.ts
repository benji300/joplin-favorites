import joplin from 'api';

/**
 * Advanced style setting default values.
 * Used when setting is set to 'default'.
 */
export enum SettingDefaults {
  Default = 'default',
  Font = 'Roboto',
  Background = 'var(--joplin-background-color3)',
  Foreground = 'var(--joplin-color-faded)',
  DividerColor = 'var(--joplin-divider-color)'
}

/**
 * Favorite type definition.
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
  dataType: string
}

/**
 * Array of favorite descriptions. Order must match with FavoriteType enum.
 */
export const FavoriteDesc: IFavoriteDesc[] = [
  { name: 'Notebook', icon: 'fa-book', dataType: 'folders' }, // Folder
  { name: 'Note', icon: 'fa-file-alt', dataType: 'notes' }, // Note
  { name: 'To-do', icon: 'fa-check-square', dataType: 'notes' }, // Todo
  { name: 'Tag', icon: 'fa-tag', dataType: 'tags' }, // Tag
  { name: 'Search', icon: 'fa-search', dataType: 'searches' } // Search
];

/**
 * Helper class to work with favorites array.
 */
export class Favorites {
  // [
  //   {
  //     "value": "folderId|noteId|tagId|searchQuery",
  //     "title": "userConfiguredTitle",
  //     "type": FavoriteType
  //   }
  // ]
  private _favs: any[];

  constructor() {
    this._favs = new Array();
  }

  /**
   * Reads the favorites settings array.
   */
  async read() {
    this._favs = await joplin.settings.value('favorites');
  }

  /**
   * Writes the temporay tabs store back to the settings array.
   */
  private async store() {
    await joplin.settings.setValue('favorites', this._favs);
  }

  /**
   * Gets a value whether the handled index would lead to out of bound access.
   */
  private indexOutOfBounds(index: number): boolean {
    return (index < 0 || index >= this.length());
  }

  /**
   * Gets the number of favorites.
   */
  length(): number {
    return this._favs.length;
  }

  /**
   * Gets all favorites.
   */
  getAll(): any[] {
    return this._favs;
  }

  /**
   * Gets the favorites with the handled value. Null if not exist.
   */
  get(value: string): any {
    if (value == null) return;

    for (let i: number = 0; i < this.length(); i++) {
      if (this._favs[i]['value'] === value) return this._favs[i];
    }
    return null;
  }

  /**
   * Gets index of favorite with handled value. -1 if not exist.
   */
  indexOf(value: string): number {
    if (value) {
      for (let i: number = 0; i < this.length(); i++) {
        if (this._favs[i]['value'] === value) return i;
      }
    }
    return -1;
  }

  /**
   * Gets a value whether a favorite for the handled value already exists.
   */
  hasFavorite(value: string): boolean {
    return this.indexOf(value) < 0 ? false : true;
  }

  /**
   * Adds new favorite at the end.
   */
  async add(newValue: string, newTitle: string, newType: FavoriteType) {
    if (newValue == null || newTitle == null || newType == null) return;

    this._favs.push({ value: newValue, title: newTitle, type: newType });
    await this.store();
  }

  async rename(value: string, newTitle: string) {
    const index: number = this.indexOf(value);
    if (index < 0) return;

    let favorite: any = this._favs[index];
    favorite.title = newTitle;
    this._favs.splice(index, 1, favorite);
    await this.store();
  }

  /**
   * Moves the favorite on source index to the target index.
   */
  async moveWithIndex(sourceIdx: number, targetIdx: number) {
    if (this.indexOutOfBounds(sourceIdx)) return;
    if (this.indexOutOfBounds(targetIdx)) return;

    const favorite: any = this._favs[sourceIdx];
    this._favs.splice(sourceIdx, 1);
    this._favs.splice((targetIdx == 0 ? 0 : targetIdx), 0, favorite);
    await this.store();
  }

  /**
   * Moves the favorite of source favorite to the index of the target favorite.
   */
  async moveWithValue(sourceValue: string, targetValue: string) {
    if (sourceValue == null || targetValue == null) return;

    await this.moveWithIndex(this.indexOf(sourceValue), this.indexOf(targetValue));
  }

  /**
  * Removes favorite with handled value.
  */
  async delete(value: string) {
    const index = this.indexOf(value);
    if (index >= 0) {
      this._favs.splice(index, 1);
    }
    await this.store();
  }

  /**
   * Clears the stored favorites array.
   */
  async clearAll() {
    this._favs = [];
    await this.store();
  }
}
