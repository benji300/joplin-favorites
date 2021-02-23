import joplin from 'api';
import { Favorites } from './favorites';
import { Settings } from './settings';

export class Panel {
  private _panel: any;
  private _favs: Favorites;
  private _settings: Settings;

  constructor(favs: Favorites, settings: Settings) {
    this._favs = favs;
    this._settings = settings;
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
        await joplin.commands.execute('favsAddFolder', message.id, message.targetIdx);
      }
      if (message.name === 'favsAddNote') {
        await joplin.commands.execute('favsAddNote', message.id, message.targetIdx);
      }
      if (message.name === 'favsEdit') {
        await joplin.commands.execute('favsEditFavorite', message.index);
      }
      if (message.name === 'favsOpen') {
        await joplin.commands.execute('favsOpenFavorite', message.index);
      }
      if (message.name === 'favsRename') {
        await this._favs.changeTitle(message.index, message.newTitle);
        await this.updateWebview();
      }
      if (message.name === 'favsDrag') {
        await this._favs.moveWithIndex(message.index, message.targetIdx);
        await this.updateWebview();
      }
      if (message.name === 'favsDelete') {
        await this._favs.delete(message.index);
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
  }

  private getPanelTitleHtml(): string {
    let panelTitleHtml: string = '';

    if (this._settings.showPanelTitle) {
      const fg = this._settings.foreground;

      panelTitleHtml = `
        <div id="panel-title" draggable="false" style="height:${this._settings.lineHeight}px;">
          <span class="fas fa-star" style="color:${fg};"></span>
          <span class="title" style="color:${fg};">FAVORITES</span>
        </div>
      `;
    }
    return panelTitleHtml;
  }

  // create HTML for each favorite
  private getFavoritesHtml(): string {
    const favsHtml: any = [];
    let index: number = 0;

    for (const favorite of this._favs.favorites) {
      const fg = this._settings.foreground;
      const bg = this._settings.background;
      const hoverBg = this._settings.hoverBackground;
      const dividerColor = this._settings.dividerColor;

      let typeIconHtml: string = '';
      if (this._settings.showTypeIcons) {
        typeIconHtml = `<span class="fas ${Favorites.getDesc(favorite).icon}" title="${Favorites.getDesc(favorite).name}" style="color:${fg};"></span>`;
      }

      let dataId: string = '';
      if (Favorites.isNote(favorite) || Favorites.isTodo(favorite)) {
        dataId = `data-id="${favorite.value}"`;
      }

      favsHtml.push(`
        <div id="favorite" data-idx="${index++}" ${dataId} data-bg="${bg}" draggable="${this._settings.enableDragAndDrop}"
          onclick="clickFav(event)" oncontextmenu="openDialog(event)" onmouseover="setBackground(event,'${hoverBg}')" onmouseout="resetBackground(this)"
          ondragstart="dragStart(event)" ondragover="dragOver(event, '${hoverBg}')" ondragleave="dragLeave(event)" ondrop="drop(event)" ondragend="dragEnd(event)"
          style="height:${this._settings.lineHeight}px;min-width:${this._settings.minFavWidth}px;max-width:${this._settings.maxFavWidth}px;background:${bg};border-color:${dividerColor};">
          <span class="favorite-inner" style="border-color:${dividerColor};">
            ${typeIconHtml}
            <input class="title" title="${favorite.title}" value="${favorite.title}" style="color:${fg};" disabled></input>
            <span class="controls" style="background:${hoverBg};">
              <span class="rename fas fa-pen" title="Rename" style="color:${fg};"></span>
              <span class="delete fas fa-trash" title="Delete" style="color:${fg};"></span>
            </span>
          </span>
        </div>
      `);
    }
    return favsHtml.join('\n');
  }

  async updateWebview() {
    const panelTitleHtml: string = this.getPanelTitleHtml();
    const favsHtml: string = this.getFavoritesHtml();

    // add entries to container and push to panel
    await joplin.views.panels.setHtml(this._panel, `
      <div id="container" style="background:${this._settings.background};font-family:'${this._settings.fontFamily}',sans-serif;font-size:${this._settings.fontSize};">
        ${panelTitleHtml}
        <div id="favs-container" draggable="${this._settings.enableDragAndDrop}"
          ondragover="dragOver(event, '${this._settings.hoverBackground}');" ondragleave="dragLeave(event);" ondrop="drop(event);" ondragend="dragEnd(event);"
          style="height:${this._settings.lineHeight}px;">
          ${favsHtml}
          <div style="height:${this._settings.lineHeight}px;min-width:10px;"></div>
        </div>
      </div>
    `);
  }

  /**
   * Toggle visibility of the panel.
   */
  async toggleVisibility() {
    const isVisible: boolean = await joplin.views.panels.visible(this._panel);
    await joplin.views.panels.show(this._panel, (!isVisible));
  }
}