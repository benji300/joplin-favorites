import joplin from 'api';
import { SettingItemType } from 'api/types';
import { ChangeEvent } from 'api/JoplinSettings';

/**
 * Advanced style setting default values.
 * Used when setting is set to 'default'.
 */
enum SettingDefaults {
  Default = 'default',
  FontFamily = 'var(--joplin-font-family)',
  FontSize = 'var(--joplin-font-size)',
  Background = 'var(--joplin-background-color3)',
  HoverBackground = 'var(--joplin-background-color-hover3)', // var(--joplin-background-hover)
  Foreground = 'var(--joplin-color-faded)',
  DividerColor = 'var(--joplin-divider-color)'
}

/**
 * Definitions of plugin settings.
 */
export class Settings {
  // private settings
  private _favs: any[] = new Array();
  // general settings
  private _enableDragAndDrop: boolean = true;
  private _editBeforeAdd: boolean = true;
  private _showPanelTitle: boolean = true;
  private _showTypeIcons: boolean = true;
  private _lineHeight: number = 30;
  private _minFavoriteWidth: number = 15;
  private _maxFavoriteWidth: number = 100;
  // advanced settings
  private _fontFamily: string = SettingDefaults.Default;
  private _fontSize: string = SettingDefaults.Default;
  private _background: string = SettingDefaults.Default;
  private _hoverBackground: string = SettingDefaults.Default;
  private _foreground: string = SettingDefaults.Default;
  private _dividerColor: string = SettingDefaults.Default;
  // internals
  private _defaultRegExp: RegExp = new RegExp(SettingDefaults.Default, "i");

  constructor() {
  }

  //#region GETTER

  get favorites(): any[] {
    return this._favs;
  }

  get enableDragAndDrop(): boolean {
    return this._enableDragAndDrop;
  }

  get editBeforeAdd(): boolean {
    return this._editBeforeAdd;
  }

  get showPanelTitle(): boolean {
    return this._showPanelTitle;
  }

  get showTypeIcons(): boolean {
    return this._showTypeIcons;
  }

  get lineHeight(): number {
    return this._lineHeight;
  }

  get minFavWidth(): number {
    return this._minFavoriteWidth;
  }

  get maxFavWidth(): number {
    return this._maxFavoriteWidth;
  }

  get fontFamily(): string {
    return this._fontFamily;
  }

  get fontSize(): string {
    return this._fontSize;
  }

  get background(): string {
    return this._background;
  }

  get hoverBackground(): string {
    return this._hoverBackground;
  }

  get foreground(): string {
    return this._foreground;
  }

  get dividerColor(): string {
    return this._dividerColor;
  }

  //#endregion

  //#region GLOBAL VALUES

  //#endregion

  /**
   * Register settings section with all options and intially read them at the end.
   */
  async register() {
    // register settings in own section
    await joplin.settings.registerSection('favorites.settings', {
      label: 'Favorites',
      iconName: 'fas fa-star'
    });
    await joplin.settings.registerSettings({
      // private settings
      favorites: {
        value: [],
        type: SettingItemType.Array,
        section: 'favorites.settings',
        public: false,
        label: 'Favorites',
        storage: 2
      },
      // general settings
      enableDragAndDrop: {
        value: this._enableDragAndDrop,
        type: SettingItemType.Bool,
        section: 'favorites.settings',
        public: true,
        label: 'Enable drag & drop of favorites',
        description: 'If enabled, the position of favorites can be change via drag & drop.',
        storage: 2
      },
      editBeforeAdd: {
        value: this._editBeforeAdd,
        type: SettingItemType.Bool,
        section: 'favorites.settings',
        public: true,
        label: 'Edit favorite before add',
        description: 'Opens a dialog to edit the favorite before adding it. If disabled, the name can still be changed later.',
        storage: 2
      },
      showPanelTitle: {
        value: this._showPanelTitle,
        type: SettingItemType.Bool,
        section: 'favorites.settings',
        public: true,
        label: 'Show favorites panel title',
        description: "Display 'FAVORITES' title in front of the favorites.",
        storage: 2
      },
      showTypeIcons: {
        value: this._showTypeIcons,
        type: SettingItemType.Bool,
        section: 'favorites.settings',
        public: true,
        label: 'Show type icons for favorites',
        description: 'Display icons before favorite titles representing the types (notebook, note, tag, etc.).',
        storage: 2
      },
      lineHeight: {
        value: this._lineHeight,
        type: SettingItemType.Int,
        section: 'favorites.settings',
        public: true,
        minimum: 20,
        label: 'Line height (px)',
        description: 'Line height of the favorites panel.',
        storage: 2
      },
      minFavoriteWidth: {
        value: this._minFavoriteWidth,
        type: SettingItemType.Int,
        section: 'favorites.settings',
        public: true,
        label: 'Minimum favorite width (px)',
        description: 'Minimum width of one favorite in pixel.',
        storage: 2
      },
      maxFavoriteWidth: {
        value: this._maxFavoriteWidth,
        type: SettingItemType.Int,
        section: 'favorites.settings',
        public: true,
        label: 'Maximum favorite width (px)',
        description: 'Maximum width of one favorite in pixel.',
        storage: 2
      },

      // advanced settings
      fontFamily: {
        value: this._fontFamily,
        type: SettingItemType.String,
        section: 'favorites.settings',
        public: true,
        advanced: true,
        label: 'Font family',
        description: "Font family used in the panel. Font families other than 'default' must be installed on the system. If the font is incorrect or empty, it might default to a generic sans-serif font. (default: App default)",
        storage: 2
      },
      fontSize: {
        value: this._fontSize,
        type: SettingItemType.String,
        section: 'favorites.settings',
        public: true,
        advanced: true,
        label: 'Font size',
        description: "Font size used in the panel. Values other than 'default' must be specified in valid CSS syntax, e.g. '13px'. (default: App default font size)",
        storage: 2
      },
      mainBackground: {
        value: this._background,
        type: SettingItemType.String,
        section: 'favorites.settings',
        public: true,
        advanced: true,
        label: 'Background color',
        description: 'Main background color of the panel. (default: Note list background color)',
        storage: 2
      },
      hoverBackground: {
        value: this._hoverBackground,
        type: SettingItemType.String,
        section: 'favorites.settings',
        public: true,
        advanced: true,
        label: 'Hover Background color',
        description: 'Background color used when hovering a favorite. (default: Note list hover color)',
        storage: 2
      },
      mainForeground: {
        value: this._foreground,
        type: SettingItemType.String,
        section: 'favorites.settings',
        public: true,
        advanced: true,
        label: 'Foreground color',
        description: 'Foreground color used for text and icons. (default: App faded color)',
        storage: 2
      },
      dividerColor: {
        value: this._dividerColor,
        type: SettingItemType.String,
        section: 'favorites.settings',
        public: true,
        advanced: true,
        label: 'Divider color',
        description: 'Color of the divider between the favorites. (default: App default border color)',
        storage: 2
      }
    });
    this._favs = await joplin.settings.value('favorites');

    // initially read settings
    await this.read();
  }

  private async getOrDefault(event: ChangeEvent, localVar: any, setting: string, defaultValue?: string): Promise<any> {
    const read: boolean = (!event || event.keys.includes(setting));
    if (read) {
      const value: string = await joplin.settings.value(setting);
      if (defaultValue && value.match(this._defaultRegExp)) {
        return defaultValue;
      } else {
        return value;
      }
    }
    return localVar;
  }

  /**
   * Update settings. Either all or only changed ones.
   */
  async read(event?: ChangeEvent) {
    this._enableDragAndDrop = await this.getOrDefault(event, this._enableDragAndDrop, 'enableDragAndDrop');
    this._editBeforeAdd = await this.getOrDefault(event, this._editBeforeAdd, 'editBeforeAdd');
    this._showPanelTitle = await this.getOrDefault(event, this._showPanelTitle, 'showPanelTitle');
    this._showTypeIcons = await this.getOrDefault(event, this._showTypeIcons, 'showTypeIcons');
    this._lineHeight = await this.getOrDefault(event, this._lineHeight, 'lineHeight');
    this._minFavoriteWidth = await this.getOrDefault(event, this._minFavoriteWidth, 'minFavoriteWidth');
    this._maxFavoriteWidth = await this.getOrDefault(event, this._maxFavoriteWidth, 'maxFavoriteWidth');
    this._fontFamily = await this.getOrDefault(event, this._fontFamily, 'fontFamily', SettingDefaults.FontFamily);
    this._fontSize = await this.getOrDefault(event, this._fontSize, 'fontSize', SettingDefaults.FontSize);
    this._background = await this.getOrDefault(event, this._background, 'mainBackground', SettingDefaults.Background);
    this._hoverBackground = await this.getOrDefault(event, this._hoverBackground, 'hoverBackground', SettingDefaults.HoverBackground);
    this._foreground = await this.getOrDefault(event, this._foreground, 'mainForeground', SettingDefaults.Foreground);
    this._dividerColor = await this.getOrDefault(event, this._dividerColor, 'dividerColor', SettingDefaults.DividerColor);
  }

  /**
   * Store the favorites array back to the settings.
   */
  async storeFavorites() {
    await joplin.settings.setValue('favorites', this._favs);
  }

  /**
   * Clear the settings favorites array.
   */
  async clearFavorites() {
    this._favs = [];
    await this.storeFavorites();
  }
}
