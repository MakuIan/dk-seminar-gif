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

const imgInput = document.getElementById("img-input");
const sourceImage = document.getElementById("source-image");
const imageCanvas = document.getElementById("image-canvas");
const pixelHighlighter = document.getElementById("pixel-highlighter");
const ctx = imageCanvas.getContext("2d");
const dictBody = document.getElementById("dict-body");
const tableWrapper = document.querySelector(".table-wrapper");

const Woerterbuch = initializeWoerterbuch();

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
  const { indexStream, colorPalette } = prepareDataForLZW(imgData);

  console.log("Index Stream:", indexStream);
  console.log("Color Palette:", colorPalette);

  runLZW(indexStream, Woerterbuch);

  //   TODO Pixel Highlighting implementieren

  //   pixelHighlighter.style.display = "block";
  //   pixelHighlighter.style.transform = `translate(0px, 0px)`;
  //   pixelHighlighter.style.width = `1px`;
  //   pixelHighlighter.style.height = `1px`;
};

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
 *
 * @param {String} code
 * @param {String} pattern
 */
function addDictRowToUI(code, pattern) {
  const row = "<tr><td>" + code + "</td><td>" + pattern + "</td></tr>";
  const dictBody = document.getElementById("dict-body");
  const tableWrapper = document.querySelector(".table-wrapper");

  dictBody.insertAdjacentHTML("beforeend", row);
  if (tableWrapper) {
    tableWrapper.scrollTop = tableWrapper.scrollHeight;
  }
}
function updateHighlighterPosition(x, y) {
  // TODO Implement highlighter position update
}
