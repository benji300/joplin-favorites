import joplin from 'api';
import { ButtonSpec, DialogResult } from 'api/types';
import { FavoriteType, FavoriteDesc } from './favorites';

export class Dialog {
  private _dialog: any;
  private _title: string;

  constructor(title: string) {
    this._title = title;
  }

  static async showMessage(message: string): Promise<number> {
    const result: number = await joplin.views.dialogs.showMessageBox(message);
    return result;
  }

  /**
   * Gets the full path, tag name or search query for the favorite.
   */
  private async getFullPath(value: string, type: FavoriteType): Promise<string> {
    switch (type) {
      case FavoriteType.Folder:
      case FavoriteType.Note:
      case FavoriteType.Todo:
        const item = await joplin.data.get([FavoriteDesc[type].dataType, value], { fields: ['title', 'parent_id'] });
        if (item) {
          let parents: any[] = new Array();
          let parent_id: string = item.parent_id;

          while (parent_id) {
            const parent: any = await joplin.data.get(['folders', parent_id], { fields: ['title', 'parent_id'] });
            if (!parent) break;
            parent_id = parent.parent_id;
            parents.push(parent.title);
          }
          parents.reverse().push(item.title);
          return parents.join('/');
        }

      case FavoriteType.Tag:
        const tag = await joplin.data.get([FavoriteDesc[type].dataType, value], { fields: ['title'] });
        if (tag) {
          return tag.title;
        }

      case FavoriteType.Search:
        return value;

      default:
        break;
    }
    return '';
  }

  /**
   * Prepare dialog html content.
   */
  private async prepareDialogHtml(value: string, title: string, type: FavoriteType): Promise<string> {
    const path: string = await this.getFullPath(value, type);
    const disabled: string = (type === FavoriteType.Search) ? '' : 'disabled';

    return `
      <div>
        <h3><i class="fas ${FavoriteDesc[type].icon}"></i>${this._title} ${FavoriteDesc[type].name} Favorite</h3>
        <form name="inputForm">
          <label for="title"><strong>Name</strong></label>
          <input type="text" id="title" name="title" value="${title}" tabindex="0" autofocus required>
          <label for="value"><strong>${FavoriteDesc[type].label}</strong></label>
          <textarea id="value" name="value" rows="3" ${disabled} tabindex="0" required>${path}</textarea>
        </form>
      </div>
    `;
  }

  /**
   * Register the dialog.
   */
  async register(buttons?: ButtonSpec[]) {
    this._dialog = await joplin.views.dialogs.create('dialog' + this._title);
    await joplin.views.dialogs.addScript(this._dialog, './assets/fontawesome/css/all.min.css');
    await joplin.views.dialogs.addScript(this._dialog, './webview_dialog.css');
    if (buttons) {
      await joplin.views.dialogs.setButtons(this._dialog, buttons);
    }
  }

  /**
   * Open the dialog width the handled values and return result.
   */
  async open(value: string, title: string, type: FavoriteType): Promise<DialogResult> {
    const dialogHtml: string = await this.prepareDialogHtml(value, title, type);
    await joplin.views.dialogs.setHtml(this._dialog, dialogHtml);
    const result: DialogResult = await joplin.views.dialogs.open(this._dialog);
    return result;
  }
}