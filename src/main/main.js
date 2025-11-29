/**
 * ============================================================================
 * DATEI: main.js
 * TYP: Steuerung & UI
 * ============================================================================
 * BESCHREIBUNG:
 * DOM-Manipulation und Event-Handling
 * Verbindet die HTML-Elemente (Buttons, Canvas, Tabellen) mit der Logik aus lzw.js
 * ============================================================================
 */

/**
 * Image Input
 *
 * @type {*}
 */
const imgInput = document.getElementById("img-input");
/**
 * Source Image img
 *
 * @type {*}
 */
const sourceImage = document.getElementById("source-image");
/**
 * Canvas
 *
 * @type {*}
 */
const imageCanvas = document.getElementById("image-canvas");
/**
 * pixelHighliger div
 *
 * @type {*}
 */
const pixelHighlighter = document.getElementById("pixel-highlighter");
/**
 * Canvas Context
 *
 * @type {*}
 */
const ctx = imageCanvas.getContext("2d");
/**
 * Wörterbuch Tabelle Body (tbody)
 *
 * @type {*}
 */
const dictBody = document.getElementById("dict-body");
/**
 * Wörterbuch Tabelle div Wrapper
 *
 * @type {*}
 */
const tableWrapper = document.querySelector(".table-wrapper");
/**
 * Demo Starten Button
 *
 * @type {*}
 */
const startDemoBtn = document.getElementById("start-demo-btn");
/**
 *  Sto/Reset Button
 *
 * @type {*}
 */
const stopDemoBtn = document.getElementById("stop-demo-btn");
/**
 *  Output Box
 *
 * @type {*}
 */
const outputContainer = document.getElementById("output-container");

/**
 * Woerterbuch für LZW
 *
 * @type {{}}
 */
const Woerterbuch = initializeWoerterbuch();
/**
 * Index Stream des geladenen Bildes von transformImageDataToIndexStream
 *
 * @type {*}
 */
let indexStream = null;
/**
 * Color Palette des geladenen Bildes von transformImageDataToIndexStream
 *
 * @type {*}
 */
let globalColorPalette = null;
/**
 * Flag ob die Demo läuft
 *
 * @type {boolean}
 */
let isDemoRunning = false;

// Initialisiere das Wörterbuch im UI
setWoerterbuchTabelle(Woerterbuch);
console.log("Initiales Wörterbuch:", Woerterbuch);

// Dieser Event Listener reagiert auf das Hochladen eines Bildes
imgInput.addEventListener("change", (event) => {
  if (event.target.files.length == 0) {
    console.log("No Image selected");
    return;
  }

  const file = event.target.files[0];

  if (!file.type.startsWith("image/")) {
    console.log("Selected file is not an image.");
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const imgDataUrl = e.target.result;
    sourceImage.src = imgDataUrl;
  };
  reader.readAsDataURL(file);
});

// Dieser Event Listener reagiert, wenn das Bild geladen wurde
sourceImage.onload = () => {
  imageCanvas.width = sourceImage.width;
  imageCanvas.height = sourceImage.height;

  ctx.drawImage(sourceImage, 0, 0);

  console.log(
    "Image loaded with dimensions:",
    sourceImage.width,
    sourceImage.height
  );

  const imgData = ctx.getImageData(0, 0, sourceImage.width, sourceImage.height);
  const result = transformImageDataToIndexStream(imgData);
  indexStream = result.indexStream;
  globalColorPalette = result.colorPalette;

  console.log("Index Stream:", indexStream);
  console.log("Color Palette:", globalColorPalette);
};

startDemoBtn.addEventListener("click", async () => {
  if (isDemoRunning) return;
  const Woerterbuch = initializeWoerterbuch();
  setWoerterbuchTabelle(Woerterbuch);

  const outputContainer = document.getElementById("output-container");
  outputContainer.innerHTML = "";
  // Security Check: Has an image been loaded?
  if (!indexStream || indexStream.length === 0) {
    alert("Bitte zuerst ein Bild laden!");
    console.error("IndexStream is empty or undefined");
    return;
  }

  isDemoRunning = true;
  startDemoBtn.disabled = true;
  stopDemoBtn.disabled = false;

  console.log("Starting LZW with:", indexStream);

  // Now both variables are available
  await runLZW(indexStream, Woerterbuch);
});

stopDemoBtn.addEventListener("click", () => {
  isDemoRunning = false;
  startDemoBtn.disabled = false;
  stopDemoBtn.disabled = true;
  console.log("Stop requested...");
});

/**
 * Initialisiert die Woerterbuch Tabelle im UI
 *
 * @param {Objekt} Woerterbuch
 */
function setWoerterbuchTabelle(Woerterbuch) {
  dictBody.innerHTML = Object.entries(Woerterbuch)
    .map(([key, value]) => {
      return `<tr><td>${key}</td><td>${value}</td></tr>`;
    })
    .join("");
}
/**
 * Initialisiert das Woerterbuch
 *
 * @returns {{}} - {'clear': 256, 'end': 257, 0: 0, 1: 1, ..., 255: 255}
 */
function initializeWoerterbuch() {
  const Woerterbuch = { ...[...Array(256).keys()] };
  Woerterbuch["clear"] = 256;
  Woerterbuch["end"] = 257;
  return Woerterbuch;
}

/**
 * Fügt eine neue Zeile in die Tabelle hinzu
 * Ist aufgerufen in runLZW
 *
 * @param {String} code
 * @param {String} pattern
 */
function addDictRowToUI(code, pattern) {
  const row =
    '<tr class="new-row"><td>' + code + "</td><td>" + pattern + "</td></tr>";
  const dictBody = document.getElementById("dict-body");
  const tableWrapper = document.querySelector(".table-wrapper");

  dictBody.insertAdjacentHTML("beforeend", row);
  if (tableWrapper) {
    tableWrapper.scrollTop = tableWrapper.scrollHeight;
  }
}

/**
 * Fügt einen neuen Output-Chip im UI hinzu
 * Ist aufgerufen in runLZW
 *
 * @param {*} code
 * @param {*} symbol
 */
function addOutputToUI(code, symbol) {
  const chip = document.createElement("div");
  chip.classList.add("output-chip");
  chip.innerText = symbol;

  if (code == 256 || code == 257) {
    chip.classList.add("chip-control");
    if (code == 256) chip.innerText = "CLEAR";
    if (code == 257) chip.innerText = "END";
  } else if (code > 257) {
    chip.classList.add("chip-compressed");
  } else {
    chip.classList.add("chip-single");
  }

  outputContainer.appendChild(chip);
  if (outputContainer) {
    outputContainer.scrollTop = outputContainer.scrollHeight;
  }
}

/**
 * Description placeholder
 *
 * @param {*} x
 * @param {*} y
 */
function updateHighlighterPosition(x, y) {
  // TODO Implement highlighter position update
}
