/**
 * ============================================================================
 * DATEI: lzw.js
 * ============================================================================
 * BESCHREIBUNG:
 * Diese Datei implementiert den reinen LZW-Algorithmus
 * ============================================================================
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getDelays = (state) => {
  const base = state.speed !== undefined ? state.speed : 600;
  const short = Math.max(1, base * 0.5);
  const pause = 100;
  return { base, short, pause };
};
/**
 * Da Canvas ImageData nur rohe RGBA-Werte liefert, müssen die Daten in Farbindizes umgewandelt werden.
 * Geht nur bis zu 256 Farben (GIF Limit)
 *
 *
 * @param {*} imageData - ImageData Objekt vom Canvas
 *
 * @returns {Object} { indexStream: Array<number>, colorPalette: Array<String>}
 */
function transformImageDataToIndexStream(imageData) {
  const rawData = imageData.data; // [r,g,b,a, r,g,b,a, ...]
  const indexStream = []; // Array der Farbindizes
  const colorPalette = []; // Array der eindeutigen Farben e.g. ['255,0,0', '0,255,0', ...]
  const colorMap = new Map(); // key: 'r,g,b' , value: index in colorPalette

  for (let i = 0; i < rawData.length; i += 4) {
    const r = rawData[i];
    const g = rawData[i + 1];
    const b = rawData[i + 2];

    const colorKey = `${r},${g},${b}`;

    if (!(colorKey in colorMap)) {
      if (colorPalette.length < 256) {
        const newIndex = colorPalette.length;
        colorPalette.push(colorKey);
        colorMap[colorKey] = newIndex;
      } else {
        console.warn(
          "Mehr als 256 Farben im Bild! GIF unterstützt nur 256 Farben."
        );
        return null;
      }
    }
    indexStream.push(colorMap[colorKey]);
  }
  return { indexStream: indexStream, colorPalette: colorPalette };
}

/**
 * LZW Algorithmus Implementierung
 * Video zum Algorithmus: https://www.youtube.com/watch?v=dLvvGXwKUGw&t=182s
 *
 * @async
 * @param {Array<number>} indexStream - Eingangs-Datenstrom der Farbindizes
 * @param {Object} Woerterbuch - Initiales Wörterbuch
 *
 */
async function runLZW(indexStream, Woerterbuch, state) {
  updateBitWidthUI(9);
  highlightEncoderPseudocode(1);

  let nextCode = 258;
  const outputStream = [];
  let w = String(indexStream[0]);

  outputStream.push(Woerterbuch["clear"]);
  addOutputToUI(Woerterbuch["clear"], "CLEAR CODE");

  updateIndexStreamHighlight(0);
  addProcessRowToUI("-", w, "-", "-", false);

  await sleep(getDelays(state).short);

  let currentCodeSize = 9;
  let nextBump = 512;

  for (let i = 1; i < indexStream.length; i++) {
    if (!state.running) {
      console.log("Process aborted by user.");
      return;
    }

    highlightEncoderPseudocode(2);

    while (state.paused) {
      await sleep(getDelays(state).pause);
      if (!state.running) return;
    }

    highlightEncoderPseudocode(3);
    updateIndexStreamHighlight(i);

    await sleep(getDelays(state).short);

    const k = String(indexStream[i]);
    const wk = w + " " + k;

    highlightEncoderPseudocode(4);
    await sleep(getDelays(state).short);

    if (wk in Woerterbuch) {
      highlightEncoderPseudocode(5);
      addProcessRowToUI(w, k, "-", "-", false);
      w = wk;

      await sleep(getDelays(state).short);
    } else {
      highlightEncoderPseudocode(6);
      await sleep(getDelays(state).short);

      let codeOutput = Woerterbuch[w];
      outputStream.push(codeOutput);
      highlightEncoderPseudocode(7);
      addOutputToUI(codeOutput, w);
      await sleep(getDelays(state).short);

      highlightEncoderPseudocode(8);
      Woerterbuch[wk] = nextCode;
      addDictRowToUI(nextCode, wk);

      const newEntryDisplay = `${wk} (${nextCode})`;
      addProcessRowToUI(w, k, newEntryDisplay, codeOutput, true);

      nextCode++;

      if (nextCode > nextBump && currentCodeSize < 12) {
        currentCodeSize++;
        nextBump = 1 << currentCodeSize; // Naechste Potenz (1024,2048,...)
        updateBitWidthUI(currentCodeSize);
      }

      // Gif erlaubt nur maximal 12 bits Code Laengen (4096 Eintraege im Woerterbuch)
      if (nextCode >= 4096) {
        outputStream.push(Woerterbuch["clear"]);
        addOutputToUI(Woerterbuch["clear"], "CLEAR CODE");
        for (const key in Woerterbuch) delete Woerterbuch[key];
        const tempDict = initializeWoerterbuch();
        Object.assign(Woerterbuch, tempDict);
        nextCode = 258;

        currentCodeSize = 9;
        nextBump = 512;
        updateBitWidthUI(9);
        await sleep(getDelays(state).base);
      }

      highlightEncoderPseudocode(9);
      w = String(k);
    }
    await sleep(getDelays(state).base);
  }
  highlightEncoderPseudocode(10);
  if (w !== "") {
    let codeOutput = Woerterbuch[w];
    outputStream.push(codeOutput);
    addOutputToUI(codeOutput, w);
    // addProcessRowToUI(w, "EOF", "-", codeOutput, false);
    await sleep(getDelays(state).short);
  }

  outputStream.push(Woerterbuch["end"]);
  addOutputToUI(Woerterbuch["end"], "END CODE");
  highlightEncoderPseudocode(-1);

  console.log("Final Output Stream:", outputStream);

  window.latestOutputStream = outputStream;

  return outputStream;
}

/**
 * ============================================================================
 * LZW Decoder
 * ============================================================================
 *
 */
async function runLZWDecoder(
  inputStream,
  Woerterbuch,
  state,
  colorPalette,
  imageWidth
) {
  let nextCode = 258;
  window.currentPixelIndex = 0; // Startwert für die Zeichnung

  const step = async (line) => {
    highlightPseudocode(line);
    await sleep(getDelays(state).short);
    while (state.paused) {
      await sleep(getDelays(state).pause);
      if (!state.decoding) return false;
    }
    return state.decoding;
  };
  // --- INITIALISIERUNG ---
  if (!(await step(1))) return;
  let pointer = 0;
  updateDecodeInputHighlight(pointer);
  let c = inputStream[pointer];
  // 1. Check: Ist der erste Code ein CLEAR-Code?
  if (c === 256) {
    updateDecoderVars(256, "Init", "CLEAR");
    pointer++;
    updateDecodeInputHighlight(pointer);
    c = inputStream[pointer]; // Nimm den echten ersten Daten-Code
    if (!(await step(1))) return;
  }
  if (!(await step(2))) return;
  let J = String(Woerterbuch[c]);
  updateDecoderVars(c, "-", J);
  if (!(await step(3))) return;
  addDecodeOutputToUI(J, colorPalette, imageWidth);
  drawPixelsFromSequence(J, colorPalette); // UI-Aufruf
  if (!(await step(4))) return;
  let I = J;
  updateDecoderVars(c, I, J);
  // --- SCHLEIFE ---
  for (let k = pointer + 1; k < inputStream.length; k++) {
    if (!(await step(5))) return;

    updateDecodeInputHighlight(k);

    c = inputStream[k];

    // Ende-Bedingung
    if (c === 257) {
      updateDecoderVars(257, I, "END");
      break;
    }
    // Falls zwischendurch ein CLEAR kommt (selten in einfachen GIFs)
    if (c === 256) continue;
    if (!(await step(6))) return;
    updateDecoderVars(c, I, "-");
    if (c in Woerterbuch) {
      if (!(await step(7))) return;
      if (!(await step(8))) return;
      J = String(Woerterbuch[c]);
    } else {
      if (!(await step(9))) return;
      if (!(await step(10))) return;
      // Sonderfall: Kette noch nicht im Dict (Kette + erstes Zeichen der Kette)
      let firstCharI = I.split(" ")[0];
      J = I + " " + firstCharI;
    }
    updateDecoderVars(c, I, J);
    if (!(await step(11))) return;
    let firstCharJ = J.split(" ")[0];
    let newEntry = I + " " + firstCharJ;
    Woerterbuch[nextCode] = newEntry;
    addDecodeDictRowToUI(nextCode, newEntry); // UI-Aufruf
    nextCode++;
    if (!(await step(12))) return;
    addDecodeOutputToUI(J, colorPalette, imageWidth);
    drawPixelsFromSequence(J, colorPalette); // UI-Aufruf
    if (!(await step(13))) return;
    I = J;
    updateDecoderVars(c, I, J);
  }

  highlightPseudocode(-1); // Eine ID, die es nicht gibt, um alle Highlights zu löschen
  console.log("Dekodierung abgeschlossen.");

  // Optional: Eine Erfolgsmeldung in die UI schreiben
  if (typeof showDecodeFinished === "function") {
    showDecodeFinished();
  }
}
