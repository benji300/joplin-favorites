import { Settings } from "./settings";

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
 * Definition of favorite entries.
 */
export interface IFavorite {
  // Favorite value = folderId|noteId|tagId|searchQuery
  value: string,
  // User configured title
  title: string,
  // Type of the favorite
  type: FavoriteType
}

/**
 * Definition of the favorite descriptions.
 */
interface IFavoriteDesc {
  readonly name: string,
  readonly icon: string,
  readonly dataType: string,
  readonly label: string
}

/**
 * Array of favorite descriptions. Order must match with FavoriteType enum.
 */
const FavoriteDesc: IFavoriteDesc[] = [
  { name: 'Notebook', icon: 'fa-book', dataType: 'folders', label: 'Full path' }, // Folder
  { name: 'Note', icon: 'fa-file-alt', dataType: 'notes', label: 'Full path' }, // Note
  { name: 'To-do', icon: 'fa-check-square', dataType: 'notes', label: 'Full path' }, // Todo
  { name: 'Tag', icon: 'fa-tag', dataType: 'tags', label: 'Tag' }, // Tag
  { name: 'Search', icon: 'fa-search', dataType: 'searches', label: 'Search query' } // Search
];

/**
 * Helper class to work with favorites.
 * - Read settings array once at startup.
 * - Then work on this.favorites array.
 */
export class Favorites {
  private _settings: Settings;

  /**
   * Initialization of Favorites.
   */
  constructor(settings: Settings) {
    this._settings = settings;
  }

  //#region GETTER

  /**
   * All favorites.
   */
  get favorites(): IFavorite[] {
    return this._settings.favorites;
  }

  /**
   * Number of favorites.
   */
  get length(): number {
    return this.favorites.length;
  }

  //#endregion

  /**
   * Write tabs array back to settings.
   * 
   * TODO: Would be better in an "onClose()" event of the plugin. Then they would only be stored once.
   */
  private async store() {
    await this._settings.storeFavorites();
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
  private encodeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .trim();
  }

  /**
   * Decodes escaped HTML characters back.
   */
  private decodeHtml(unsafe: string): string {
    return unsafe
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  }

  static isNote(favorite: IFavorite): boolean {
    if (favorite) {
      return (favorite.type === FavoriteType.Note);
    }
    return false;
  }

  static isTodo(favorite: IFavorite): boolean {
    if (favorite) {
      return (favorite.type === FavoriteType.Todo);
    }
    return false;
  }

  static isSearch(favorite: IFavorite): boolean {
    if (favorite) {
      return (favorite.type === FavoriteType.Search);
    }
    return false;
  }

  static getDesc(favorite: IFavorite): IFavoriteDesc {
    if (favorite === undefined) return;
    return FavoriteDesc[favorite.type];
  }

  /**
   * Gets the favorites with the handled value. Null if not exist.
   */
  get(index: number): IFavorite {
    if (this.indexOutOfBounds(index)) return;
    return this.favorites[index];
  }

  /**
   * Gets the HTML decoded value of the handled favorite.
   * Workaround to copy search strings to clipboard.
   */
  getDecodedValue(favorite: IFavorite): string {
    if (favorite === undefined) return;
    return this.decodeHtml(favorite.value);
  }

  /**
   * Gets index of favorite with handled value. -1 if not exist.
   */
  indexOf(value: string): number {
    if (value) {
      for (let i: number = 0; i < this.length; i++) {
        if (this.favorites[i]['value'] === value) return i;
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
   * Creates new instance of IFavorite.
   */
  create(newValue: string, newTitle: string, newType: FavoriteType): IFavorite {
    const newFavorite: IFavorite = { value: this.encodeHtml(newValue), title: this.encodeHtml(newTitle), type: newType };
    return newFavorite;
  }

  /**
   * Adds note as new favorite at the handled index or at the end.
   */
  async add(newValue: string, newTitle: string, newType: FavoriteType, targetIdx?: number) {
    if (newValue === undefined || newTitle === undefined || newType === undefined) return;

    const newFavorite = this.create(newValue, newTitle, newType);
    if (targetIdx && targetIdx > 0) {
      this.favorites.splice(targetIdx, 0, newFavorite);
    } else {
      this.favorites.push(newFavorite);
    }
    await this.store();
  }

  /**
   * Changes the title of the handled favorite.
   */
  async changeValue(index: number, newValue: string) {
    if (index < 0 || newValue === undefined || newValue === '') return;

    this.favorites[index].value = this.encodeHtml(newValue);
    await this.store();
  }

  /**
   * Changes the title of the handled favorite.
   */
  async changeTitle(index: number, newTitle: string) {
    if (index < 0 || newTitle === undefined || newTitle === '') return;

    this.favorites[index].title = this.encodeHtml(newTitle);
    await this.store();
  }

  /**
   * Changes the type of the handled favorite.
   */
  async changeType(index: number, newType: FavoriteType) {
    if (index < 0 || newType === undefined) return;

    this.favorites[index].type = newType;
    await this.store();
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
    const favorite: IFavorite = this.favorites[sourceIdx];
    this.favorites.splice(sourceIdx, 1);
    this.favorites.splice(target, 0, favorite);
    await this.store();
  }

  /**
   * Removes favorite with handled index.
   */
  async delete(index: number) {
    if (index >= 0) {
      this.favorites.splice(index, 1);
      await this.store();
    }
  }
}
