let editStarted = false;
let sourceIdx = '';

function cancelDefault(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

function getDataId(currentTarget) {
  if (currentTarget && currentTarget.id === 'favorite') {
    return currentTarget.dataset.id;
  }
}

function getDataIdx(currentTarget) {
  if (currentTarget && currentTarget.id === 'favorite') {
    return currentTarget.dataset.idx;
  }
}

/* EVENT HANDLER */

function openFav(currentTarget) {
  const dataIdx = getDataIdx(currentTarget);
  if (dataIdx) {
    webviewApi.postMessage({ name: 'favsOpen', index: dataIdx });
  }
}

function deleteFav(currentTarget) {
  const dataIdx = getDataIdx(currentTarget);
  if (dataIdx) {
    webviewApi.postMessage({ name: 'favsDelete', index: dataIdx });
  }
}

function openDialog(event) {
  if (!editStarted) {
    const dataIdx = getDataIdx(event.currentTarget);
    if (dataIdx) {
      webviewApi.postMessage({ name: 'favsEdit', index: dataIdx });
    }
  }
}

function enableEdit(element, value) {
  editStarted = value;
  element.readOnly = (!value);
  element.focus();
  element.select();
}

function editFav(currentTarget) {
  const input = currentTarget.getElementsByTagName('input')[0];
  if (input) {
    enableEdit(input, true);
  }
}

// default click handler
function clickFav(event) {
  cancelDefault(event);
  if (!editStarted) {
    if (event.target.classList.contains('rename')) {
      editFav(event.currentTarget);
    } else if (event.target.classList.contains('delete')) {
      deleteFav(event.currentTarget);
    } else {
      openFav(event.currentTarget);
    }
  }
}

// rename finished with changes
document.addEventListener('change', event => {
  cancelDefault(event);
  const element = event.target;
  if (editStarted && element.className === 'title') {
    enableEdit(element, false);
    const dataIdx = element.parentElement.parentElement.dataset.idx;
    if (dataIdx && element.value !== '') {
      webviewApi.postMessage({ name: 'favsRename', index: dataIdx, newTitle: element.value });
    } else {
      element.value = element.title;
    }
  }
});

// input lost focus (w/o changes)
document.addEventListener('focusout', (event) => {
  cancelDefault(event);
  const element = event.target;
  if (editStarted && element.className === 'title') {
    enableEdit(element, false);
    element.value = element.title;
  }
});

// scroll horizontally without 'shift' key
document.addEventListener('wheel', (event) => {
  const element = document.getElementById('favs-container');
  if (element) {
    element.scrollLeft -= (-event.deltaY);
  }
});

/* DRAG AND DROP */

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
  const dataIdx = getDataIdx(event.currentTarget);
  if (dataIdx) {
    event.dataTransfer.setData('text/x-plugin-favorites-idx', dataIdx);
    sourceIdx = dataIdx;
  }
  // prepare note ID for drag&drop to other panels
  const dataId = getDataId(event.currentTarget);
  if (dataId) {
    event.dataTransfer.setData('text/x-plugin-favorites-id', dataId);
  }
}

function dragEnd(event) {
  resetTabBackgrounds();
  cancelDefault(event);
  sourceIdx = '';
}

function dragOver(event, hoverColor) {
  resetTabBackgrounds();
  cancelDefault(event);
  if (sourceIdx !== getDataIdx(event.currentTarget)) {
    setBackground(event, hoverColor);
  }
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  resetTabBackgrounds();
  cancelDefault(event);
  const dataTargetIdx = getDataIdx(event.currentTarget);

  // check whether plugin tab was dragged - trigger favsDrag message
  const dataSourceIdx = event.dataTransfer.getData('text/x-plugin-favorites-idx');
  if (dataSourceIdx) {
    if (dataTargetIdx !== sourceIdx) {
      webviewApi.postMessage({ name: 'favsDrag', index: dataSourceIdx, targetIdx: dataTargetIdx, });
      return;
    }
  }

  // check whether folder was dragged from app onto the panel - trigger favsAddFolder then
  const joplinFolderIds = event.dataTransfer.getData('text/x-jop-folder-ids');
  if (joplinFolderIds) {
    const folderIds = JSON.parse(joplinFolderIds);
    if (folderIds.length == 1) {
      webviewApi.postMessage({ name: 'favsAddFolder', id: folderIds[0], targetIdx: dataTargetIdx });
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
    webviewApi.postMessage({ name: 'favsAddNote', id: noteIds, targetIdx: dataTargetIdx });
    return;
  }

  // check whether tab (from joplin.plugin.note.tabs plugin) was dragged onto the panel - add new favorite at dropped index
  const noteTabsId = event.dataTransfer.getData('text/x-plugin-note-tabs-id');
  if (noteTabsId) {
    const noteIds = new Array(noteTabsId);
    webviewApi.postMessage({ name: 'favsAddNote', id: noteIds, targetIdx: dataTargetIdx });
    return;
  }
}
