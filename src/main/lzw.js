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
 *
 *
 * @param {*} imageData - ImageData Objekt vom Canvas
 *
 * @returns {Object} { indexStream: Array<number>, colorPalette: Array<String>}
 */
function prepareDataForLZW(imageData) {
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
        // TODO: FarbQuantisierung implementieren (Nachfragen, ob das ueberhaupt gemacht werden soll)
        // TODO: Wenn nicht, dann sollte der Prozess abbrechen
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
async function runLZW(indexStream, Woerterbuch) {
  //   TODO Implement LZW
  let nextCode = 258;
  const outputStream = [];
  addOutputToUI(Woerterbuch["clear"], "CLEAR CODE");

  let w = String(indexStream[0]);

  // TODO Update highlighter
  // updateHighlighterPosition(0, 0)

  for (let i = 1; i < indexStream.length; i++) {
    const k = String(indexStream[i]);
    const wk = w + "," + k;

    if (wk in Woerterbuch) {
      w = wk;
    } else {
      let codeOutput = Woerterbuch[w];
      outputStream.push(codeOutput);
      addOutputToUI(codeOutput, w);

      Woerterbuch[wk] = nextCode;
      addDictRowToUI(nextCode, wk);
      await sleep(0);
      nextCode++;

      w = String(k);
    }
  }
  if (w !== "") {
    let codeOutput = Woerterbuch[w];
    outputStream.push(codeOutput);
    addOutputToUI(codeOutput, w);
  }

  outputStream.push(Woerterbuch["end"]);
  addOutputToUI(Woerterbuch["end"], "END CODE");

  console.log("Final Output Stream:", outputStream);
}
/**
 * Description placeholder
 *
 * @param {*} x
 * @param {*} y
 */

// TODO Output Datenstrom, zur Zeit nur in der Konsole
/**
 * Description placeholder
 *
 * @param {*} code
 * @param {*} symbol
 */
function addOutputToUI(code, symbol) {
  console.log(`OUT: ${code}, Symbol: ${symbol}`);
}
