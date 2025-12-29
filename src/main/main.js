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
 * HTML Elements
 */
const imgInput = document.getElementById("img-input");
const sourceImage = document.getElementById("source-image");
const imageCanvas = document.getElementById("image-canvas");
const pixelHighlighter = document.getElementById("pixel-highlighter");
const ctx = imageCanvas.getContext("2d");
const dictBody = document.getElementById("dict-body");
const processTable = document.getElementById("process-table");
const processTableBody = document.getElementById("process-body");
const tableWrapperLzwProcessTableWrapper = document.querySelector(
  ".lzw-process-table-wrapper"
);
const indexStreamSection = document.getElementById("index-stream-section");
const outputContainer = document.getElementById("output-container");
const outputDataStreamSection = document.getElementById(
  "output-data-stream-section"
);
const resultsSection = document.getElementById("results-section");
/**
 * ============================================================================
 * BUTTONS & STATE
 * ============================================================================
 */
const startBtn = document.getElementById("start-demo-btn");
const pauseBtn = document.getElementById("pause-demo-btn");
const resumeBtn = document.getElementById("resume-demo-btn");
const resetBtn = document.getElementById("reset-demo-btn");

const appState = {
  running: false,
  paused: false
};

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
let uploadFileSize = 0;

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
  uploadFileSize = file.size;

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
  if (!result) {
    alert(
      "Das Bild hat zu viele Farben! Bitte ein Bild mit maximal 256 Farben hochladen!"
    );
  }
  indexStream = result.indexStream;
  globalColorPalette = result.colorPalette;
  addIndexStreamOutputToUI(indexStream, globalColorPalette);

  console.log("Index Stream:", indexStream);
  console.log("Color Palette:", globalColorPalette);
};

// EventListener fuers Starten des Algos
startBtn.addEventListener("click", async () => {
  if (appState.running) return;

  outputContainer.innerHTML = "";
  // Security Check: Has an image been loaded?
  if (!indexStream || indexStream.length === 0) {
    alert("Bitte zuerst ein Bild laden!");
    console.error("IndexStream is empty or undefined");
    return;
  }
  const Woerterbuch = initializeWoerterbuch();
  setWoerterbuchTabelle(Woerterbuch);

  appState.running = true;
  appState.paused = false;
  updateButtonState("running");

  console.log("Starting LZW with:", indexStream);

  // Now both variables are available
  const lzwResult = await runLZW(indexStream, Woerterbuch, appState);

  // Gif download
  if (appState.running) {
    if (lzwResult && lzwResult.length > 0) {
      console.log("LZW fertig, erstelle GIF...");
      const gifBlob = createGifBlob(
        sourceImage.width,
        sourceImage.height,
        globalColorPalette,
        lzwResult
      );

      const originalSize = uploadFileSize;
      const compressedSize = gifBlob.size;

      addCompressionStatsToUI(originalSize, compressedSize);
      addDownloadBtnToUI(gifBlob);
      console.log("gifBlob created:", gifBlob.size, "bytes");
    }
    updateButtonState("finished");
    appState.running = false;
  }
});

// EventListener fuers Pausieren des Algos
pauseBtn.addEventListener("click", () => {
  console.log("presed Paused");
  appState.paused = true;
  updateButtonState("paused");
  console.log("Paused");
});

// EventListener fuers Fortsetzen des Algos
resumeBtn.addEventListener("click", () => {
  appState.paused = false;
  updateButtonState("running");
  console.log("Resuming");
});

// EventListener fuers Zuruecksetzen des Algos
resetBtn.addEventListener("click", () => {
  appState.running = false;
  appState.paused = false;
  resetUI();
  updateButtonState("idle");
  console.log("Reset");
});

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
