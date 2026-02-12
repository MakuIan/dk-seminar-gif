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
 * Wartet 'ms' Millisekunden und prüft danach (und währenddessen), ob pausiert wurde.
 * Gibt 'false' zurück, wenn der Prozess abgebrochen wurde (Reset), sonst 'true'.
 */
async function sleepAndCheckPause(ms, state) {
  await sleep(ms);

  while (state.paused) {
    await sleep(getDelays(state).pause);
    // KRITISCH: Hier müssen wir prüfen, ob IRGENDETWAS noch läuft.
    // Wenn beides false ist, wurde Reset gedrückt.
    if (!state.running && !state.decoding) return false;
  }

  // Finaler Check nach der Pause oder nach dem ersten Sleep
  if (!state.running && !state.decoding) return false;

  return true;
}
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
  let LW = ""; 
  let nextCode = 258;
  const outputStream = [];
  
  let currentRowId = prepareProcessRow();
  updateProcessRow(currentRowId, { w: '""' });

  outputStream.push(Woerterbuch["clear"]);
  addOutputToUI(Woerterbuch["clear"], "CLEAR CODE");

  if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;

  let currentCodeSize = 9;
  let nextBump = 512;

  for (let i = 0; i < indexStream.length; i++) {
    if (!state.running) {
      console.log("Process aborted by user.");
      return;
    }

    // Schritt 2: Highlighting der Schleifen-Bedingung bei jedem Durchgang
    highlightEncoderPseudocode(2);
    if (!(await sleepAndCheckPause(getDelays(state).base, state))) return;

    while (state.paused) {
      if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;
      if (!state.running) return;
    }

    // Schritt 3: Lies nächstes Zeichen
    highlightEncoderPseudocode(3);
    updateIndexStreamHighlight(i);
    const Z = String(indexStream[i]);
    updateProcessRow(currentRowId, { k: Z });

    if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;

    // Schritt 4: Prüfung
    const LWZ = (LW === "") ? Z : LW + " " + Z;
    highlightEncoderPseudocode(4);
    if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;

    if (LWZ in Woerterbuch) {
      // Schritt 5: LW := LW + Z
      highlightEncoderPseudocode(5);
      updateProcessRow(currentRowId, { entry: "-", output: "-" });
      LW = LWZ;

      if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;
      
      currentRowId = prepareProcessRow();
      updateProcessRow(currentRowId, { w: LW });

    } else {
      // Schritt 6: Sonst-Zweig
      highlightEncoderPseudocode(6);
      if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;

      // Schritt 7: Nur Wörterbuch hinzufügen und entsprechende Tabellenspalte füllen
      highlightEncoderPseudocode(7);
      Woerterbuch[LWZ] = nextCode;
      addDictRowToUI(nextCode, LWZ);
      updateProcessRow(currentRowId, { entry: `${LWZ} (${nextCode})` });

      // Pause zwischen Wörterbuch-Eintrag und Code-Ausgabe
      if (!(await sleepAndCheckPause(getDelays(state).base, state))) return;

      // Schritt 8: Code für LW ausgeben und rechte Tabellenspalte füllen
      highlightEncoderPseudocode(8);
      let codeOutput = Woerterbuch[LW];
      outputStream.push(codeOutput);
      addOutputToUI(codeOutput, LW);
      updateProcessRow(currentRowId, { output: codeOutput });

      nextCode++;

      if (nextCode > nextBump && currentCodeSize < 12) {
        currentCodeSize++;
        nextBump = 1 << currentCodeSize; 
        updateBitWidthUI(currentCodeSize);
      }

      if (nextCode >= 4096) {
        outputStream.push(Woerterbuch["clear"]);
        addOutputToUI(Woerterbuch["clear"], "CLEAR CODE");
        nextCode = 258;
        currentCodeSize = 9;
        nextBump = 512;
        updateBitWidthUI(9);
        if (!(await sleepAndCheckPause(getDelays(state).base, state))) return;
      }

      if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;

      // Schritt 9: LW := Z
      highlightEncoderPseudocode(9);
      LW = String(Z);
      
      currentRowId = prepareProcessRow();
      updateProcessRow(currentRowId, { w: LW });
    }
    if (!(await sleepAndCheckPause(getDelays(state).base, state))) return;
  }

  // Abschlussprüfung
  highlightEncoderPseudocode(10);
  if (LW !== "") {
    if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;
    highlightEncoderPseudocode(11);
    let codeOutput = Woerterbuch[LW];
    outputStream.push(codeOutput);
    addOutputToUI(codeOutput, LW);
    updateProcessRow(currentRowId, { k: "EOF", entry: "-", output: codeOutput });
    if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;
  }

  outputStream.push(Woerterbuch["end"]);
  addOutputToUI(Woerterbuch["end"], "END CODE");
  highlightEncoderPseudocode(-1);

  console.log("Final Output Stream:", outputStream);

  window.latestOutputStream = outputStream;

  return outputStream;
}

async function runLZWDecoder(inputStream, Woerterbuch, state, colorPalette, imageWidth) {
  let nextCode = 258;
  window.currentPixelIndex = 0;

  const step = async (line) => {
    highlightPseudocode(line);
    return await sleepAndCheckPause(getDelays(state).short, state);
  };

  let pointer = 0;
  // Stille Vorphase
  while (pointer < inputStream.length && inputStream[pointer] === 256) {
    updateDecodeInputHighlight(pointer);
    if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;
    pointer++;
  }

  if (pointer >= inputStream.length || !state.decoding) return;

  // --- INITIALISIERUNG ---
  
  // Schritt 1: Lies ersten Code
  updateDecodeInputHighlight(pointer);
  let c = inputStream[pointer];
  updateDecoderVars(c, "-", "-"); 
  if (!(await step(1))) return;

  // Schritt 2: J := W[c]
  let J = String(Woerterbuch[c]);
  updateDecoderVars(c, "-", J);
  if (!(await step(2))) return;

  // Schritt 3: Gib J aus
  addDecodeOutputToUI(J, colorPalette, imageWidth);
  drawPixelsFromSequence(J, colorPalette); 
  if (!(await step(3))) return;

  // Schritt 4: I := J
  let I = J;
  updateDecoderVars(c, I, J);
  if (!(await step(4))) return;

  // --- SCHLEIFE ---
  for (let k = pointer + 1; k < inputStream.length; k++) {
    // Schritt 5: Solange Codes vorhanden
    if (!(await step(5))) return;

    c = inputStream[k];
    updateDecodeInputHighlight(k);

    if (c === 257) {
      updateDecoderVars(257, I, "END");
      highlightPseudocode(-1);
      break;
    }
    if (c === 256) {
      if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;
      continue;
    }

    // Schritt 6: c := lies nächsten Code
    updateDecoderVars(c, I, "-");
    if (!(await step(6))) return;

    // --- SCHRITT 7: DIE PRÜFUNG (Immer highlighten!) ---
    highlightPseudocode(7);
    // Wir machen hier eine extra Pause, damit man die Entscheidung sieht
    if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;

    if (c in Woerterbuch) {
      // Schritt 8: J := W[c]
      J = String(Woerterbuch[c]);
      updateDecoderVars(c, I, J);
      if (!(await step(8))) return;
    } else {
      // Schritt 9: Falls c nicht bekannt (Highlight Zeile 9)
      highlightPseudocode(9);
      if (!(await sleepAndCheckPause(getDelays(state).short, state))) return;

      // Schritt 10: J := I + I[0]
      let firstCharI = I.split(" ")[0];
      J = I + " " + firstCharI;
      updateDecoderVars(c, I, J);
      if (!(await step(10))) return;
    }

    // Schritt 11: Wörterbuch-Eintrag
    let firstCharJ = J.split(" ")[0];
    let newEntry = I + " " + firstCharJ;
    Woerterbuch[nextCode] = newEntry;
    addDecodeDictRowToUI(nextCode, newEntry); 
    nextCode++;
    if (!(await step(11))) return;

    // Schritt 12: Gib J aus
    addDecodeOutputToUI(J, colorPalette, imageWidth);
    drawPixelsFromSequence(J, colorPalette); 
    if (!(await step(12))) return;

    // Schritt 13: I := J
    I = J;
    updateDecoderVars(c, I, J);
    if (!(await step(13))) return;
  }

  highlightPseudocode(-1);
  if (typeof showDecodeFinished === "function") showDecodeFinished();
}