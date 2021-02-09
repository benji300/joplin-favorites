let editStarted = false;
let currentTarget = undefined;
let sourceId = '';
let timeout = 0;
let clicks = 0;

function getDataId(currentTarget) {
  if (currentTarget && currentTarget.id === 'favorite') {
    return currentTarget.dataset.id;
  } else {
    return;
  }
}

/* EDIT FAVORITE IN DIALOG (CONTEXT MENU) */
function openDialog(event) {
  if (!editStarted) {
    const dataId = getDataId(event.currentTarget);
    if (dataId) {
      webviewApi.postMessage({ name: 'favsEdit', id: dataId });
    }
  }
}

/* OPEN OR RENAME FAVORITE (CLICK) */
function openFav(currentTarget) {
  const dataId = getDataId(currentTarget);
  if (dataId) {
    webviewApi.postMessage({ name: 'favsOpen', id: dataId });
  }
}

function enableEdit(element, value) {
  editStarted = value;
  element.readOnly = (!value);
  element.style.fontWeight = value ? 'bold' : 'normal';
  element.focus();
  if (!value) clicks = 0;
}

function editFav(currentTarget) {
  const input = currentTarget.getElementsByTagName('input')[0];
  if (input) {
    enableEdit(input, true);
  }
}

// handle click and dblclick events
// delay click event by 250ms and wait for (possible) second click
// Workaround for current search favorite implementation:
//  - dblClick for search favs does not work right as the command sets the focus to the global search
//  - Thus the input from the panel loses its focus - so it never can be edited
function clickFav(event) {
  currentTarget = event.currentTarget;
  clicks++;

  if (clicks == 1 && !editStarted) {
    setTimeout(function () {
      if (clicks == 1) {
        openFav(currentTarget);
      } else {
        editFav(currentTarget);
      }
      currentTarget = undefined;
      clicks = 0;
    }, timeout || 250);
  }
};

document.addEventListener('change', event => {
  cancelDefault(event);
  const element = event.target;
  if (editStarted && element.className === 'title') {
    enableEdit(element, false);
    const dataId = element.parentElement.parentElement.dataset.id;
    if (dataId && element.value !== '') {
      webviewApi.postMessage({ name: 'favsRename', id: dataId, newTitle: element.value });
    } else {
      element.value = element.title;
    }
  }
});

document.addEventListener('focusout', (event) => {
  cancelDefault(event);
  const element = event.target;
  if (editStarted && element.className === 'title') {
    enableEdit(element, false);
    element.value = element.title;
  }
});

/* DRAG AND DROP */
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
  const dataId = getDataId(event.currentTarget);
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
  if (sourceId !== getDataId(event.currentTarget)) {
    setBackground(event, hoverColor);
  }
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  resetTabBackgrounds();
  cancelDefault(event);
  const dataTargetId = getDataId(event.currentTarget);

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
