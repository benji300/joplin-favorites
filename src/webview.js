/* DOUBLE CLICK EVENT */
document.addEventListener('dblclick', event => {
  const element = event.target;

  if (element.id === 'favorite' || element.className === 'favorite-inner' || element.className === 'favorite-title') {
    webviewApi.postMessage({
      name: 'favsEdit',
      id: element.dataset.id
    });
  }
})

/* CLICK EVENTS */
document.addEventListener('click', event => {
  const element = event.target;

  if (element.id === 'favorite' || element.className === 'favorite-inner' || element.className === 'favorite-title') {
    webviewApi.postMessage({
      name: 'favsOpen',
      id: element.dataset.id
    });
  }
})

/* DRAG AND DROP */
let sourceId = "";

function cancelDefault(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

function dragStart(event) {
  const element = event.target;
  element.classList.add("dragging");
  event.dataTransfer.setData("text/plain", element.dataset.id);
  sourceId = element.dataset.id
}

function dragEnd(event) {
  cancelDefault(event);
  const element = event.target;
  element.classList.remove("dragging");
  sourceId = "";
}

function dragOver(event) {
  cancelDefault(event);
  const element = event.target;

  document.querySelectorAll('#favorite').forEach(tab => {
    if (tab.dataset.id !== element.dataset.id) {
      tab.classList.remove("dragover");
    }
  });

  if (element.dataset.id !== sourceId) {
    if (element.id === 'favorite') {
      element.classList.add("dragover");
    } else if (element.parentElement.id === 'favorite') {
      element.parentElement.classList.add("dragover");
    } else if (element.parentElement.parentElement.id === 'favorite') {
      element.parentElement.parentElement.classList.add("dragover");
    }
  }
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  cancelDefault(event);
  const targetElement = event.target;
  const dataSourceId = event.dataTransfer.getData("text/plain");

  if (targetElement && dataSourceId) {
    if (targetElement.dataset.id !== sourceId) {
      webviewApi.postMessage({
        name: 'favsDrag',
        targetId: targetElement.dataset.id,
        sourceId: dataSourceId
      });
      targetElement.classList.remove("dragover");
    }
  }
}
