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

// Decoder Elemente
const decodeContainer = document.getElementById("decode-container"); // Container für Decoder
const showDecodeBtn = document.getElementById("show-decode-btn"); // Button zum Anzeigen des Decoders
const startDecodeBtn = document.getElementById("start-decode-btn"); // Button zum Starten der Dekodierung
const decodeInputStreamSection = document.getElementById("decode-input-stream"); // === NEU ===
const decodeDictBody = document.getElementById("decode-dict-body"); // === NEU ===

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
const speedRange = document.getElementById("speed-range");
appState.speed = parseInt(speedRange.max) - parseInt(speedRange.value) + 1;

// Initiale Sichtbarkeit und Button-States
decodeContainer.style.display = "none"; // Decoder Container versteckt
showDecodeBtn.disabled = true; // Button erst nach Encoding aktivieren
startDecodeBtn.disabled = false; // bleibt aktiv, sobald Container sichtbar

let encodedOutputStream = null; // === NEU ===
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

speedRange.addEventListener("input", (e) => {
  const sliderValue = parseInt(e.target.value);
  const maxValue = parseInt(e.target.max);
  appState.speed = maxValue - sliderValue + 10;
  console.log("Speed changed to", appState.speed);
});

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
    return;
  }
  indexStream = result.indexStream;
  globalColorPalette = result.colorPalette;

  renderGlobalTableUI(globalColorPalette);
  setTimeout(() => {
    addIndexStreamOutputToUI(indexStream, globalColorPalette);
  }, 10);

  console.log("Index Stream:", indexStream);
  console.log("Color Palette:", globalColorPalette);
};

// EventListener fuers Starten des Algos
startBtn.addEventListener("click", async () => {
  if (appState.running) return;

  // Security Check: Has an image been loaded?
  if (!indexStream || indexStream.length === 0) {
    alert("Bitte zuerst ein Bild laden!");
    console.error("IndexStream is empty or undefined");
    return;
  }

  // Sperre Start-Button und Bild-Upload während der Demo
  startBtn.disabled = true;
  imgInput.disabled = true;

  outputContainer.innerHTML = "";
  processTableBody.innerHTML = ""; // Tabelle Prozess löschen
  dictBody.innerHTML = ""; // Wörterbuch-Tabelle löschen
  resultsSection.innerHTML = ""; // Kompressionsstatistik löschen

  const Woerterbuch = initializeWoerterbuch();
  setWoerterbuchTabelle(Woerterbuch);

  appState.running = true;
  appState.paused = false;
  updateButtonState("running");

  console.log("Starting LZW with:", indexStream);

  // Now both variables are available
  const lzwResult = await runLZW(indexStream, Woerterbuch, appState);

  // === NEU: Decoder-Input ===
  if (lzwResult && lzwResult.length > 0) {
    encodedOutputStream = lzwResult;
  }

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

    // Decoder Button aktivieren nach Encoding
    showDecodeBtn.disabled = false;

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
  appState.decoding = false; // Stoppt auch Decoder-Prozess

  resetUI();
  updateButtonState("idle"); // Hier wird startBtn wieder auf false (also klickbar) gesetzt

  // === Decoder UI zurücksetzen ===
  decodeContainer.style.display = "none";
  showDecodeBtn.disabled = true;
  startDecodeBtn.disabled = false; // Wieder bereit für nächsten Lauf
  decodeInputStreamSection.innerHTML = "";
  decodeDictBody.innerHTML = "";
  encodedOutputStream = null;

  const decodeOutputContainer = document.getElementById(
    "decode-output-container"
  );
  if (decodeOutputContainer) decodeOutputContainer.innerHTML = "";

  // Bild und Canvas komplett löschen
  sourceImage.src = "";
  ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  imageCanvas.width = 0;
  imageCanvas.height = 0;

  // Decoder Canvas löschen
  const decodeCanvas = document.getElementById("decode-canvas");
  if (decodeCanvas) {
    const dCtx = decodeCanvas.getContext("2d");
    dCtx.clearRect(0, 0, decodeCanvas.width, decodeCanvas.height);
    decodeCanvas.width = 0;
    decodeCanvas.height = 0;
  }

  // Daten leeren
  indexStream = null;
  globalColorPalette = null;
  indexStreamSection.innerHTML = "";
  imgInput.value = "";
  imgInput.disabled = false;

  // Wörterbuch didaktisch zurücksetzen
  const initialWoerterbuch = initializeWoerterbuch();
  setWoerterbuchTabelle(initialWoerterbuch);

  // Ergebnisse + Kompressionsstatistik löschen
  outputContainer.innerHTML = "";
  processTableBody.innerHTML = "";
  resultsSection.innerHTML = "";

  // Start-Button explizit freigeben (sicher ist sicher)
  startBtn.disabled = false;
});

// Decoder Container öffnen
showDecodeBtn.addEventListener("click", () => {
  decodeContainer.style.display = "block";
  decodeContainer.scrollIntoView({ behavior: "smooth" });
  // === NEU: Decoder-Wörterbuch initialisieren ===
  const decodeWoerterbuch = initializeWoerterbuch(); // === NEU ===
  setDecodeWoerterbuchTabelle(decodeWoerterbuch); // === NEU ===

  // === NEU: Decoder Input Stream anzeigen ===
  addDecodeInputStreamToUI(encodedOutputStream); // === NEU ===
});

// Start-Button für Dekodierung (Platzhalter)
startDecodeBtn.addEventListener("click", async () => {
  if (!encodedOutputStream || encodedOutputStream.length === 0) {
    alert("Keine kodierten Daten vorhanden!");
    return;
  }

  // Header Buttons reaktivieren für den Decoder
  appState.decoding = true;
  appState.paused = false;
  updateButtonState("running"); // Nutzt die vorhandene Funktion

  startDecodeBtn.disabled = true;

  // Decoder starten
  const decodeWoerterbuch = initializeWoerterbuch();
  setDecodeWoerterbuchTabelle(decodeWoerterbuch);

  // WICHTIG: Canvas vorbereiten
  const decodeCanvas = document.getElementById("decode-canvas");
  decodeCanvas.width = sourceImage.width;
  decodeCanvas.height = sourceImage.height;
  const decodeCtx = decodeCanvas.getContext("2d");
  decodeCtx.clearRect(0, 0, decodeCanvas.width, decodeCanvas.height);

  // Pixel-Counter für diesen Durchlauf zurücksetzen
  window.currentPixelIndex = 0;

  await runLZWDecoder(encodedOutputStream, decodeWoerterbuch, appState);

  appState.decoding = false;
  updateButtonState("finished");
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
