/**
 * ============================================================================
 * DATEI: testLZW.js
 * TYP: Steuerung & UI
 * ============================================================================
 * BESCHREIBUNG:
 * Datei zum Testen des LZW-Algorithmus mit beliebiger Zeichenkette
 * ============================================================================
 */

runLZW = (indexStream, Woerterbuch) => {
  let nextCode = 5;
  const outputStream = [];
  let w = indexStream[0];

  // TODO Update highlighter to first pixel
  // updateHighlighterPosition(0, 0)

  for (let i = 1; i < indexStream.length; i++) {
    const k = indexStream[i];
    const wk = w + "," + k;

    if (wk in Woerterbuch) {
      w = wk;
    } else {
      let codeOutput = Woerterbuch[w];
      outputStream.push(codeOutput);

      Woerterbuch[wk] = nextCode;
      nextCode++;

      w = k;
    }
  }
  if (w !== "") {
    let codeOutput = Woerterbuch[w];
    outputStream.push(codeOutput);
  }

  outputStream.push(Woerterbuch["end"]);
  console.log("Final Output Stream:", outputStream);
  console.log("Final Woerterbuch:", Woerterbuch);
};

runLZW(["a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a"], {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  end: "end"
});
