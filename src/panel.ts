import joplin from 'api';
import { FavoriteDesc, Favorites } from './favorites';
import { Settings } from './settings';

export class Panel {

  private _panel: any;
  private _favs: Favorites;
  private _settings: Settings;

  constructor(favs: Favorites, settings: Settings) {
    this._favs = favs;
    this._settings = settings;
  }

  private getPanelTitleHtml(): string {
    let panelTitleHtml: string = '';

    if (this._settings.showPanelTitle) {
      panelTitleHtml = `
        <div id="panel-title" style="height:${this._settings.lineHeight}px;"
          ondragover="dragOverTitle(event);" ondragleave="dragLeave(event);" ondrop="dropOnTitle(event);" ondragend="dragLeave(event);">
          <span class="fas fa-star" style="color:${this._settings.foreground};"></span>
          <span class="title" style="color:${this._settings.foreground};">FAVORITES</span>
        </div>
      `;
    }
    return panelTitleHtml;
  }

  // create HTML for each favorite
  private getFavoritesHtml(): string {
    const favsHtml: any = [];

    for (const favorite of this._favs.all) {
      const foreground = this._settings.foreground;
      const background = this._settings.background;
      const hoverBg = this._settings.hoverBackground;
      const dividerColor = this._settings.dividerColor;

      let typeIconHtml: string = '';
      if (this._settings.showTypeIcons) {
        typeIconHtml = `<span class="fas ${FavoriteDesc[favorite.type].icon}" style="color:${foreground};"></span>`;
      }

      favsHtml.push(`
        <div id="favorite" data-id="${favorite.value}" draggable="${this._settings.enableDragAndDrop}"
          onclick="favsClick(event);" oncontextmenu="favsContext(event);" onMouseOver="this.style.background='${hoverBg}';" onMouseOut="this.style.background='none';"
          ondragstart="dragStart(event);" ondragover="dragOver(event, '${hoverBg}');" ondragleave="dragLeave(event);" ondrop="drop(event);" ondragend="dragEnd(event);"
          style="height:${this._settings.lineHeight}px;min-width:${this._settings.minFavWidth}px;max-width:${this._settings.maxFavWidth}px;background:${background};border-color:${dividerColor};color:${foreground};">
          <span class="favorite-inner" style="border-color:${dividerColor};">
            ${typeIconHtml}
            <span class="title" title="${favorite.title}">
              ${favorite.title}
            </span>
          </span>
        </div>
      `);
    }
    return favsHtml.join('\n');
  }

  /**
   * Register plugin panel and update webview for the first time.
   */
  async register() {
    this._panel = await joplin.views.panels.create('favorites.panel');
    await joplin.views.panels.addScript(this._panel, './assets/fontawesome/css/all.min.css');
    await joplin.views.panels.addScript(this._panel, './webview.css');
    await joplin.views.panels.addScript(this._panel, './webview.js');
    await joplin.views.panels.onMessage(this._panel, async (message: any) => {
      if (message.name === 'favsAddFolder') {
        await joplin.commands.execute('favsAddFolder', message.id);
      }
      if (message.name === 'favsAddNote') {
        await joplin.commands.execute('favsAddNote', message.id);
      }
      if (message.name === 'favsEdit') {
        await joplin.commands.execute('favsEditFavorite', message.id);
      }
      if (message.name === 'favsOpen') {
        await joplin.commands.execute('favsOpenFavorite', message.id);
      }
      if (message.name === 'favsDrag') {
        await this._favs.moveWithValue(message.sourceId, message.targetId);
        await this.updateWebview();
      }
    });

    // set init message
    await joplin.views.panels.setHtml(this._panel, `
      <div id="container" style="background:${this._settings.background};font-family:'${this._settings.fontFamily}',sans-serif;font-size:${this._settings.fontSize};">
        <div id="favs-container">
          <p style="padding-left:8px;">Loading panel...</p>
        </div>
      </div>
    `);

    await this.updateWebview();
  }

  async updateWebview() {
    const panelTitleHtml: string = this.getPanelTitleHtml();
    const favsHtml: string = this.getFavoritesHtml();

    // add entries to container and push to panel
    await joplin.views.panels.setHtml(this._panel, `
      <div id="container" style="background:${this._settings.background};font-family:'${this._settings.fontFamily}',sans-serif;font-size:${this._settings.fontSize};">
        <div id="favs-container">
          ${panelTitleHtml}
          ${favsHtml}
        </div>
      </div>
    `);

    // store the current favorites array back to the settings
    // - Currently there's no "event" to call store() only on App closing
    // - Which would be preferred
    await this._settings.storeFavorites(this._favs.all);
  }

  /**
   * Toggle visibility of the panel.
   */
  async toggleVisibility() {
    const isVisible: boolean = await joplin.views.panels.visible(this._panel);
    await joplin.views.panels.show(this._panel, (!isVisible));
  }
}