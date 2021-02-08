
function getDataId(event) {
  if (event.currentTarget.id === 'favorite') {
    return event.currentTarget.dataset.id;
  } else {
    return;
  }
}

/* CLICK EVENTS */
function openFav(event) {
  const dataId = getDataId(event);
  if (dataId) {
    webviewApi.postMessage({ name: 'favsOpen', id: dataId });
  }
}

// edit favorite in dialog
function openDialog(event) {
  const dataId = getDataId(event);
  if (dataId) {
    webviewApi.postMessage({ name: 'favsEdit', id: dataId });
  }
}

// RENAME FAVORITE IN PANEL
var editStarted = 'false';

function editFavStart(event) {
  event.target.contentEditable = 'true';
  editStarted = 'true';
}
// TODO dblclick geht bei search nicht richtig
//  - test mit eventlistener hier statt dblclick an html?
function setNewTitle(event) {
  const element = event.target;
  element.contentEditable = 'false';
  editStarted = 'false';
  const dataId = element.parentElement.parentElement.dataset.id;
  if (dataId && element.innerText !== '') {
    webviewApi.postMessage({ name: 'favsRename', id: dataId, newTitle: element.innerText });
  } else {
    element.innerText = element.title;
  }
  cancelDefault(event);
}

document.addEventListener('dblclick', event => {
  const element = event.target;
  if (element.className === 'title') {
    element.contentEditable = 'true';
    editStarted = 'true';
  }
});

document.addEventListener('keydown', event => {
  const element = event.target;
  if (editStarted && element.className === 'title') {
    if (event.key === 'Enter' || event.key === 'Tab') {
      setNewTitle(event);
    } else if (event.key === 'Escape') {
      element.contentEditable = 'false';
      element.innerText = element.title;
      editStarted = 'false';
      cancelDefault(event);
    }
  }
});

document.addEventListener('focusout', (event) => {
  if (editStarted && event.target.className === 'title') {
    setNewTitle(event);
  }
});

/* DRAG AND DROP */
let sourceId = '';

function cancelDefault(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

function setBackground(event, background) {
  event.currentTarget.style.background = background;
}

function resetBackground(element) {
  if (element.dataset.bg) {
    element.style.background = element.dataset.bg;
  }
}

function resetTabBackgrounds() {
  document.querySelectorAll('#favorite').forEach(x => { resetBackground(x); });

  container = document.querySelector('#favs-container');
  if (container) {
    container.style.background = 'none';
  }
}

function dragStart(event) {
  const dataId = getDataId(event);
  if (dataId) {
    event.dataTransfer.setData('text/x-plugin-favorites-id', dataId);
    sourceId = dataId;
  }
}

function dragEnd(event) {
  resetTabBackgrounds();
  cancelDefault(event);
  sourceId = '';
}

function dragOver(event, hoverColor) {
  resetTabBackgrounds();
  cancelDefault(event);
  if (sourceId !== getDataId(event)) {
    setBackground(event, hoverColor);
  }
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  resetTabBackgrounds();
  cancelDefault(event);
  const dataTargetId = getDataId(event);

  // check whether plugin tab was dragged - trigger favsDrag message
  const dataSourceId = event.dataTransfer.getData('text/x-plugin-favorites-id');
  if (dataSourceId) {
    if (dataTargetId !== sourceId) {
      webviewApi.postMessage({ name: 'favsDrag', targetId: dataTargetId, sourceId: dataSourceId });
      return;
    }
  }

  // check whether folder was dragged from app onto the panel - trigger favsAddFolder then
  const joplinFolderIds = event.dataTransfer.getData('text/x-jop-folder-ids');
  if (joplinFolderIds) {
    const folderIds = JSON.parse(joplinFolderIds);
    if (folderIds.length == 1) {
      webviewApi.postMessage({ name: 'favsAddFolder', id: folderIds[0], targetId: dataTargetId });
      return;
    }
  }

  // check whether note was dragged from app onto the panel - add new favorite at dropped index
  const joplinNoteIds = event.dataTransfer.getData('text/x-jop-note-ids');
  if (joplinNoteIds) {
    const noteIds = new Array();
    for (const noteId of JSON.parse(joplinNoteIds)) {
      noteIds.push(noteId);
    }
    webviewApi.postMessage({ name: 'favsAddNote', id: noteIds, targetId: dataTargetId });
    return;
  }

  // check whether tab (from joplin.plugin.note.tabs plugin) was dragged onto the panel - add new favorite at dropped index
  const noteTabsId = event.dataTransfer.getData('text/x-plugin-note-tabs-id');
  if (noteTabsId) {
    const noteIds = new Array(noteTabsId);
    webviewApi.postMessage({ name: 'favsAddNote', id: noteIds, targetId: dataTargetId });
    return;
  }
}
