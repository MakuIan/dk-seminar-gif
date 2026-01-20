/**
 * ============================================================================
 * DATEI: lzw.js
 * ============================================================================
 * BESCHREIBUNG:
 * Diese Datei implementiert den reinen LZW-Algorithmus
 * ============================================================================
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
  let nextCode = 258;
  const outputStream = [];
  let w = String(indexStream[0]);

  outputStream.push(Woerterbuch["clear"]);
  addOutputToUI(Woerterbuch["clear"], "CLEAR CODE");

  updateIndexStreamHighlight(0);
  addProcessRowToUI("-", w, "-", "-", false);

  for (let i = 1; i < indexStream.length; i++) {
    if (!state.running) {
      console.log("Process aborted by user.");
      return;
    }

    while (state.paused) {
      await sleep(100);
      if (!state.running) return;
    }
    updateIndexStreamHighlight(i);

    const k = String(indexStream[i]);
    const wk = w + " " + k;

    if (wk in Woerterbuch) {
      addProcessRowToUI(w, k, "-", "-", false);
      w = wk;
    } else {
      let codeOutput = Woerterbuch[w];
      outputStream.push(codeOutput);
      addOutputToUI(codeOutput, w);

      Woerterbuch[wk] = nextCode;
      addDictRowToUI(nextCode, wk);

      const newEntryDisplay = `${wk} (${nextCode})`;
      addProcessRowToUI(w, k, newEntryDisplay, w, true);

      nextCode++;

      // Gif erlaubt nur maximal 12 bits Code Laengen (4096 Eintraege im Woerterbuch)
      if (nextCode >= 4096) {
        outputStream.push(Woerterbuch["clear"]);
        addOutputToUI(Woerterbuch["clear"], "CLEAR CODE");
        for (const key in Woerterbuch) delete Woerterbuch[key];
        const tempDict = initializeWoerterbuch();
        Object.assign(Woerterbuch, tempDict);
        nextCode = 258;
      }

      w = String(k);
    }
    await sleep(1000);
  }
  if (w !== "") {
    let codeOutput = Woerterbuch[w];
    outputStream.push(codeOutput);
    addOutputToUI(codeOutput, w);
  }

  outputStream.push(Woerterbuch["end"]);
  addOutputToUI(Woerterbuch["end"], "END CODE");

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
async function runLZWDecoder(inputStream, Woerterbuch, state) {
    let nextCode = 258;
    let decodedStream = [];
    
    // Hilfsfunktion für Pseudocode-Highlighting
    const step = async (line) => {
        highlightPseudocode(line);
        await sleep(1000); // Zeit für einen Schritt
        while (state.paused) {
            await sleep(100);
            if (!state.running && !state.decoding) return false;
        }
        return state.running || state.decoding;
    };

    // --- Schritt 1 & 2 & 3 & 4 ---
    if (!(await step(1))) return;
    let c = inputStream[0]; 
    updateDecoderVars(c, "-", "-");

    // Falls der erste Code CLEAR ist, überspringen und nächsten nehmen
    if (c === 256) {
        inputStream.shift();
        c = inputStream[0];
    }

    if (!(await step(2))) return;
    let J = String(Woerterbuch[c]);
    updateDecoderVars(c, "-", J);

    if (!(await step(3))) return;
    decodedStream.push(J);
    addDecodeOutputToUI(J);

    if (!(await step(4))) return;
    let I = J;
    updateDecoderVars(c, I, J);

    // --- Schritt 5 (Loop) ---
    for (let k = 1; k < inputStream.length; k++) {
        if (!(await step(5))) return;
        
        c = inputStream[k];
        if (!(await step(6))) return;
        updateDecoderVars(c, I, "-");

        if (c === 257) break; // END CODE
        if (c === 256) continue; // CLEAR CODE (vereinfacht)

        // Schritt 7, 8, 9, 10
        if (c in Woerterbuch) {
            if (!(await step(7))) return;
            if (!(await step(8))) return;
            J = String(Woerterbuch[c]);
        } else {
            if (!(await step(9))) return;
            if (!(await step(10))) return;
            // Der berühmte LZW-Sonderfall: J = I + I[0]
            let firstCharI = I.split(" ")[0];
            J = I + " " + firstCharI;
        }
        updateDecoderVars(c, I, J);

        // Schritt 11: Neues Wort ins Wörterbuch
        if (!(await step(11))) return;
        let firstCharJ = J.split(" ")[0];
        let newEntry = I + " " + firstCharJ;
        Woerterbuch[nextCode] = newEntry;
        addDecodeDictRowToUI(nextCode, newEntry);
        nextCode++;

        // Schritt 12: Ausgabe
        if (!(await step(12))) return;
        decodedStream.push(J);
        addDecodeOutputToUI(J);

        // Schritt 13: I = J
        if (!(await step(13))) return;
        I = J;
        updateDecoderVars(c, I, J);
    }
    
    // Am Ende Bild zeichnen
    renderDecodedImage(decodedStream);
}