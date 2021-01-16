
function getDataId(event) {
  if (event.currentTarget.id === 'favorite') {
    return event.currentTarget.dataset.id;
  }
  return;
}

/* RIGHT CLICK EVENT */
function favsContext(event) {
  const dataId = getDataId(event);
  if (dataId) {
    webviewApi.postMessage({ name: 'favsEdit', id: dataId });
  }
}

/* CLICK EVENT */
function favsClick(event) {
  const dataId = getDataId(event);
  if (dataId) {
    webviewApi.postMessage({ name: 'favsOpen', id: dataId });
  }
}

/* DRAG AND DROP */
let sourceId = '';

function cancelDefault(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

function dragStart(event) {
  const dataId = getDataId(event);
  if (dataId) {
    event.currentTarget.classList.add('dragging');
    event.dataTransfer.setData('text/favorite-id', dataId);
    sourceId = dataId;
  }
}

function dragEnd(event) {
  cancelDefault(event);
  event.currentTarget.classList.remove('dragging');
  document.querySelectorAll('#favorite').forEach(x => {
    x.classList.remove('dragover');
  });
  sourceId = '';
}

function dragOver(event) {
  cancelDefault(event);
  if (sourceId) {
    const dataId = getDataId(event);
    if (dataId) {
      document.querySelectorAll('#favorite').forEach(x => {
        if (x.dataset.id !== dataId) x.classList.remove('dragover');
      });

      if (sourceId !== dataId) {
        const element = event.currentTarget;
        element.classList.add('dragover');
      }
    }
  }
}

function dragOverTitle(event) {
  cancelDefault(event);
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  cancelDefault(event);
  const dataSourceId = event.dataTransfer.getData('text/favorite-id');
  if (dataSourceId) {
    const dataTargetId = getDataId(event);
    if (dataTargetId !== sourceId) {
      webviewApi.postMessage({ name: 'favsDrag', targetId: dataTargetId, sourceId: dataSourceId });
    }
  }
}

function dropOnTitle(event) {
  cancelDefault(event);

  // check whether folder was dragged from app onto the panel - trigger favsAddNote then
  const appDragFolderIds = event.dataTransfer.getData('text/x-jop-folder-ids');
  if (appDragFolderIds) {
    const folderIds = JSON.parse(appDragFolderIds);
    if (folderIds.length == 1) {
      webviewApi.postMessage({ name: 'favsAddFolder', id: folderIds[0] });
    }
  }

  // check whether note was dragged from app onto the panel - trigger favsAddNote then
  const appDragNoteIds = event.dataTransfer.getData('text/x-jop-note-ids');
  if (appDragNoteIds) {
    const ids = new Array();
    for (const noteId of JSON.parse(appDragNoteIds)) {
      ids.push(noteId);
    }
    webviewApi.postMessage({ name: 'favsAddNote', id: ids });
  }
}
