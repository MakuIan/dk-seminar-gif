/**
 * ============================================================================
 * DATEI: main.js
 * TYP: Steuerung & UI
 * ============================================================================
 * BESCHREIBUNG:
 * Verbindet die HTML-Elemente (Buttons, Canvas, Tabellen) mit der Logik aus lzw.js.
 * ============================================================================
 */

const imgInput = document.getElementById("imgInput");
const sourceImage = document.getElementById("sourceImage");
const imageCanvas = document.getElementById("imageCanvas");
const pixelHighlighter = document.getElementById("pixelHighlighter");
const ctx = imageCanvas.getContext("2d");

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

  //   TODO Pixel Highlighting implementieren

  //   pixelHighlighter.style.display = "block";
  //   pixelHighlighter.style.transform = `translate(0px, 0px)`;
  //   pixelHighlighter.style.width = `1px`;
  //   pixelHighlighter.style.height = `1px`;
};
