/* DOUBLE CLICK EVENT */
// document.addEventListener('dblclick', event => {
//   const element = event.target;

//   if (element.id === 'favorite' || element.className === 'favorite-inner' || element.className === 'favorite-title') {
//     webviewApi.postMessage({
//       name: 'favsEdit',
//       id: element.dataset.id
//     });
//   }
// })

function getDataId(element) {
  return (element.className === 'title' || element.classList.contains('fas')) ? element.parentElement.dataset.id : element.dataset.id;
}

/* RIGHT CLICK EVENT */
document.addEventListener('contextmenu', event => {
  const dataId = getDataId(event.target);
  if (dataId) {
    webviewApi.postMessage({ name: 'favsEdit', id: dataId });
  }
});

/* CLICK EVENTS */
document.addEventListener('click', event => {
  const dataId = getDataId(event.target);
  if (dataId) {
    webviewApi.postMessage({ name: 'favsOpen', id: dataId });
  }
});

/* DRAG AND DROP */
let sourceId = '';

function cancelDefault(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

function dragStart(event) {
  const dataId = getDataId(event.target);
  if (dataId) {
    event.target.classList.add('dragging');
    event.dataTransfer.setData('text/favorite-id', dataId);
    sourceId = dataId;
  }
}

function dragEnd(event) {
  cancelDefault(event);
  event.target.classList.remove('dragging');
  event.target.classList.remove('dragover');
  if (event.parentElement) {
    event.parentElement.classList.remove('dragging');
    event.parentElement.classList.remove('dragover');
  }
  sourceId = '';
}

function dragOver(event) {
  cancelDefault(event);
  if (sourceId) {
    const dataId = getDataId(event.target);
    if (dataId) {
      document.querySelectorAll('#favorite').forEach(x => {
        if (x.dataset.id !== dataId) x.classList.remove('dragover');
      });

      if (sourceId !== dataId) {
        const element = event.target;
        if (element.id === 'favorite') {
          element.classList.add('dragover');
        } else if (element.parentElement.id === 'favorite') {
          element.parentElement.classList.add('dragover');
        }
      }
    }
  }
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  cancelDefault(event);

  const dataSourceId = event.dataTransfer.getData('text/favorite-id');
  if (dataSourceId) {
    const dataTargetId = getDataId(event.target);
    if (dataTargetId !== sourceId) {
      webviewApi.postMessage({ name: 'favsDrag', targetId: dataTargetId, sourceId: dataSourceId });
    }
  }

  event.target.classList.remove('dragover');
  sourceId = '';
}

// drag and drop of folders/notes to favorites title
function dragOverTitle (event) {
  cancelDefault(event);
  // TODO if background is changed it might not be removed (if dialog is cancelled)
  // if (!sourceId) {
  //   if (event.target) event.target.classList.add('dragover');
  //   if (event.target.parentElement) event.target.parentElement.classList.add('dragover');
  // }
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
    return;
  }

  // check whether note was dragged from app onto the panel - trigger favsAddNote then
  const appDragNoteIds = event.dataTransfer.getData('text/x-jop-note-ids');
  if (appDragNoteIds) {
    const ids = new Array();
    for (const noteId of JSON.parse(appDragNoteIds)) {
      ids.push(noteId);
    }
    webviewApi.postMessage({ name: 'favsAddNote', id: ids });
    return;
  }

  if (event.target) event.target.classList.remove('dragover');
  if (event.target.parentElement) event.target.parentElement.classList.remove('dragover');
}