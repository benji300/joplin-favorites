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
  Folder = 1,
  Note = 2,
  Todo = 3,
  Tag = 4,
  Search = 5
}

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
   * Inserts handled favorite at specified index.
   */
  private async insertAtIndex(index: number, favorite: any) {
    if (index < 0 || favorite == null) return;

    this._favs.splice(index, 0, favorite);
    await this.store();
  }

  // /**
  //  * Replaces favorite at specified index with handled one.
  //  */
  // private async replaceAtIndex(index: number, favorite: any) {
  //   if (index < 0 || favorite == null) return;

  //   this._favs.splice(index, 1, favorite);
  //   await this.store();
  // }

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
   * Gets the favorites for the handled note.
   */
  get(index: number): any {
    if (index < 0 || index >= this.length()) return;

    return this._favs[index];
  }

  /**
   * Gets index of favorite with handled value. -1 if not exist.
   */
  indexOf(value: string): number {
    if (value == null) return;

    for (let i: number = 0; i < this.length(); i++) {
      if (this._favs[i]['id'] === value) return i;
    }
    return -1;
  }

  // /**
  //  * Gets index of the temporary tab. -1 if not exist.
  //  */
  // indexOfTemp(): number {
  //   for (let i: number = 0; i < this.length(); i++) {
  //     if (this._favs[i]['type'] === NoteTabType.Temporary) return i;
  //   }
  //   return -1;
  // }

  /**
   * Gets a value whether the handled value has already a tab or not.
   */
  hasFavorite(value: string): boolean {
    if (value == null) return;

    return this.indexOf(value) < 0 ? false : true;
  }

  /**
   * Adds new favorite at the end.
   */
  async add(newValue: string, newTitle: string, newType: FavoriteType) {
    if (newValue == null) return;

    this._favs.push({ value: newValue, title: newTitle, type: newType });
    await this.store();
  }

  /**
   * Moves the favorite on source index to the target index.
   */
  async moveWithIndex(sourceIdx: number, targetIdx: number) {
    if (sourceIdx < 0 || sourceIdx >= this.length()) return;
    if (targetIdx < 0 || targetIdx >= this.length()) return;

    // console.log(`moveWithIndex: ${sourceIdx} to ${targetIdx} with length = ${this.length()}`);

    const favorite: any = this._favs[sourceIdx];
    await this.delete(this.get(sourceIdx).id);
    await this.insertAtIndex((targetIdx == 0 ? 0 : targetIdx), favorite);
    await this.store();
  }

  /**
   * Moves the favorite of source favorite to the index of the target favorite.
   */
  async moveWithId(sourceValue: string, targetValue: string) {
    if (targetValue == null || sourceValue == null) return;

    await this.moveWithIndex(this.indexOf(sourceValue), this.indexOf(targetValue));
  }

  // /**
  //   * Changes type of the tab for the handled note.
  //   */
  // async changeType(noteId: string, newType: NoteTabType) {
  //   if (!this.hasFavorite(noteId)) return;

  //   this._favs[this.indexOf(noteId)].type = newType;
  //   await this.store();
  // }

  // /**
  //  * Replaces favorite at specified index with handled one.
  //  */
  // async replaceTemp(id: string) {
  //   if (id == null) return;

  //   const tempIdx: number = this.indexOfTemp();
  //   if (tempIdx >= 0) {
  //     this._favs[tempIdx].id = id;
  //     await this.store();
  //   }
  // }

  /**
   * Removes favorite with handled id.
   */
  async delete(value: string) {
    if (value == null) return;

    if (this.hasFavorite(value)) {
      this._favs.splice(this.indexOf(value), 1);
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
