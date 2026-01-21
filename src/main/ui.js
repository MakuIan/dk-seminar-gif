/**
 * ============================================================================
 * DATEI: ui.js
 * ZWECK: Benutzeroberflächen-Komponenten für die LZW-Komprimierung
 * ============================================================================
 * BESCHREIBUNG:
 * Enthält Funktionen zur Aktualisierung der Benutzeroberfläche, insbesondere
 * die Darstellung des LZW-Wörterbuchs und der Statusinformationen.
 * ============================================================================
 */

/**
 * Initialisiert die Woerterbuch Tabelle im UI
 *
 * @param {Objekt} Woerterbuch
 */
function setWoerterbuchTabelle(Woerterbuch) {
  dictBody.innerHTML = Object.entries(Woerterbuch)
    .map(([key, value]) => {
      if (key === "clear") return `<tr><td>CLEAR</td><td>${value}</td></tr>`; // ÄNDERUNG
      if (key === "end") return `<tr><td>END</td><td>${value}</td></tr>`; // ÄNDERUNG
      // Standardfälle: Sequenz links, Code rechts
      return `<tr><td>${value}</td><td>${key}</td></tr>`; // ÄNDERUNG (vorher war key links, value rechts)
    })
    .join("");
}
/**
 * Fügt eine neue Zeile in die Woerterbuch Tabelle hinzu
 * Ist aufgerufen in runLZW
 *
 * @param {String} code
 * @param {String} pattern
 */
function addDictRowToUI(code, pattern) {
  // ÄNDERUNG: Sonderfälle CLEAR/END prüfen
  if (pattern === 256) pattern = "CLEAR"; // ÄNDERUNG
  if (pattern === 257) pattern = "END"; // ÄNDERUNG

  const row =
    '<tr class="new-row"><td>' + pattern + "</td><td>" + code + "</td></tr>"; // ÄNDERUNG (vorher war code links, pattern rechts)
  const dictBody = document.getElementById("dict-body");
  const tableWrapper = document.querySelector(".table-wrapper");

  dictBody.insertAdjacentHTML("beforeend", row);
  if (tableWrapper) {
    tableWrapper.scrollTop = tableWrapper.scrollHeight;
  }
}
/**
 * Fügt eine neue Zeile in die Process Tabelle hinzu
 * Ist aufgerufen in runLZW
 *
 * @param{String} w
 * @param{String} k
 * @param{String} newEntry
 * @param{String} output
 * @param{boolean} isNewEntry
 */
function addProcessRowToUI(w, k, newEntry, output, isNewEntry) {
  const rowClass = isNewEntry ? "process-step-new" : "process-step-found";
  const entryDisplay = isNewEntry ? newEntry : "-";
  const outputDisplay = output
    ? `<span class="chip-single">${output}</span>`
    : "";
  const rowHTML = `<tr class="new-row ${rowClass}">
        <td>${w}</td>
        <td>${k}</td>
        <td>${entryDisplay}</td>
        <td>${outputDisplay}</td>
    </tr>`;

  processTableBody.insertAdjacentHTML("beforeend", rowHTML);
  tableWrapperLzwProcessTableWrapper.scrollTop =
    tableWrapperLzwProcessTableWrapper.scrollHeight;
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

  // ÄNDERUNG: Wir geben nur noch den Code aus, nicht die Sequenz
  if (code == 256) {
    chip.classList.add("chip-control");
    chip.innerText = "CLEAR"; // ÄNDERUNG
  } else if (code == 257) {
    chip.classList.add("chip-control");
    chip.innerText = "END"; // ÄNDERUNG
  } else if (code > 257) {
    chip.classList.add("chip-compressed");
    chip.innerText = code; // ÄNDERUNG
  } else {
    chip.classList.add("chip-single");
    chip.innerText = code; // ÄNDERUNG
  }

  outputContainer.appendChild(chip);
  if (outputContainer) {
    outputContainer.scrollTop = outputContainer.scrollHeight;
  }
}
/**
 * Fuegt IndexStream zur UI hinzu
 *
 * @param {Array} indexStream
 * @param {Array} colorPalette
 */
const addIndexStreamOutputToUI = function (indexStream, colorPalette) {
  const innerHTML = indexStream
    .map((index, i) => {
      const color = colorPalette[index]
        ? `rgb(${colorPalette[index]})`
        : "#333";

      return `<div id="idx-chip-${i}" class="index-chip pending" style="background-color:${color};" title="${index}">
                ${index}
            </div>`;
    })
    .join("");
  indexStreamSection.innerHTML = innerHTML;
};

// === NEU: DECODER UI ===

/**
 * Initialisiert die Woerterbuch-Tabelle für den Decoder
 */
function setDecodeWoerterbuchTabelle(Woerterbuch) {
  decodeDictBody.innerHTML = Object.entries(Woerterbuch)
    .map(([key, value]) => {
      if (key === "clear") return `<tr><td>CLEAR</td><td>${value}</td></tr>`;
      if (key === "end") return `<tr><td>END</td><td>${value}</td></tr>`;
      return `<tr><td>${value}</td><td>${key}</td></tr>`;
    })
    .join("");
}

/**
 * Fügt den Input-Stream für den Decoder zur UI hinzu
 */
function addDecodeInputStreamToUI(stream) {
  if (!stream || stream.length === 0) return;
  decodeInputStreamSection.innerHTML = stream
    .map(
      (code) =>
        `<div class="index-chip decode-chip">${code}</div>`
    )
    .join("");
}

/**
 * Aktualisiert die Index Chips wahrend des LZW Algorithmus
 *
 * @param {*} currentIndex
 */
function updateIndexStreamHighlight(currentIndex) {
  if (currentIndex > 0) {
    const prevChip = document.getElementById(`idx-chip-${currentIndex - 1}`);
    if (prevChip) {
      prevChip.classList.remove("active");
      prevChip.classList.add("processed");
    }
  }

  const currentChip = document.getElementById(`idx-chip-${currentIndex}`);
  if (currentChip) {
    currentChip.classList.remove("pending");
    currentChip.classList.add("active");
  }
}

/**
 * Aktualisert States der Buttons
 *
 * @param {*} state
 */
function updateButtonState(state) {
  startBtn.disabled = true;
  pauseBtn.disabled = true;
  resumeBtn.disabled = true;
  resetBtn.disabled = true;

  switch (state) {
    case "idle":
      startBtn.disabled = false;
      break;
    case "running":
      pauseBtn.disabled = false;
      resetBtn.disabled = false;
      break;
    case "paused":
      resumeBtn.disabled = false;
      resetBtn.disabled = false;
      break;
    case "finished":
      // Neue State Logik, erst Reset nötig, um sauber neuzustarten
      resetBtn.disabled = false;
      break;
  }
}

/** Setzt Woertertabelle, Index Stream, Output zurueck */
function resetUI() {
  outputContainer.innerHTML = "";
  const cleanDict = initializeWoerterbuch();
  processTableBody.innerHTML = "";
  setWoerterbuchTabelle(cleanDict);
  const chips = document.querySelectorAll(".index-chip");
  chips.forEach((chip) => {
    chip.classList.remove("active", "processed");
    chip.classList.add("pending");
  });
}

/**
 * Adds a downloadBtn to the UI after the LZW algorithm finishes
 *
 * @param {Blob} gifBlob
 */
function addDownloadBtnToUI(gifBlob) {
  const resultsSection = document.getElementById("results-section");
  if (!resultsSection) return;
  const url = URL.createObjectURL(gifBlob);
  const downloadBtn = document.createElement("a");
  downloadBtn.href = url;
  downloadBtn.download = "output.gif";
  downloadBtn.textContent = "Download GIF";
  downloadBtn.className = "contrast"; //pico css style
  downloadBtn.style.display = "block";
  downloadBtn.style.marginTop = "15px";
  downloadBtn.style.textAlign = "center";
  downloadBtn.style.padding = "10px";
  downloadBtn.style.fontWeight = "bold";
  resultsSection.appendChild(downloadBtn);
}

/**
 * Adds Compression Stats to UI
 *
 * @param {Number} originalSize
 * @param {Number} compressedSize
 */
function addCompressionStatsToUI(originalSize, compressedSize) {
  const resultsSection = document.getElementById("results-section");
  if (!resultsSection) return;
  resultsSection.style.display = "block";

  const saving = (1 - compressedSize / originalSize) * 100;

  const originalSizeKB = (originalSize / 1024).toFixed(2);
  const compressedSizeKB = (compressedSize / 1024).toFixed(2);
  const savingsText = saving.toFixed(2);

  const colorStyle = saving > 0 ? "color: #00ff8c;" : "color: #ff6b6b;";

  const statsDiv = document.createElement("div");
  statsDiv.id = "compression-stats-box";
  statsDiv.style.padding = "10px";
  statsDiv.style.backgroundColor = "var(--bg-panel)";

  statsDiv.innerHTML = `
      <h4 style="margin-bottom: 10px;">Kompressions-Statistik</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
        <div>Original:</div>
        <div style="text-align: right;">${originalSizeKB} KB</div>
        
        <div>Komprimiert:</div>
        <div style="text-align: right;">${compressedSizeKB} KB</div>
      
      </div>
      <hr style="margin: 10px 0; border-color: var(--border-color-primary);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>Platzersparnis:</span>
        <span style="font-size: 1.2em; font-weight: bold; ${colorStyle}">
          ${savingsText}%
        </span>
      </div>
    `;

  resultsSection.scrollIntoView({ behavior: "smooth" });
  resultsSection.style.borderColor = "var(--chip-compressed-glow)";
  resultsSection.appendChild(statsDiv);
}

function highlightPseudocode(lineNumber) {
    // Alle Zeilen entmarkieren
    document.querySelectorAll('.pseudocode-line').forEach(el => {
        el.classList.remove('active-line');
    });
    // Aktuelle Zeile markieren
    const active = document.querySelector(`.pseudocode-line[data-line="${lineNumber}"]`);
    if (active) active.classList.add('active-line');
}

function updateDecoderVars(c, i, j) {
    document.getElementById('var-c').textContent = c;
    document.getElementById('var-i').textContent = i;
    document.getElementById('var-j').textContent = j;
}

function addDecodeOutputToUI(sequence) {
    const container = document.getElementById('decode-output-container');
    const codes = sequence.split(" ");
    codes.forEach(code => {
        const chip = document.createElement("div");
        chip.classList.add("index-chip", "processed");
        chip.innerText = code;
        container.appendChild(chip);
    });
    container.scrollTop = container.scrollHeight;
}

function addDecodeDictRowToUI(code, pattern) {
    const row = `<tr><td>${pattern}</td><td>${code}</td></tr>`;
    const decodeDictBody = document.getElementById("decode-dict-body");
    decodeDictBody.insertAdjacentHTML("beforeend", row);
    decodeDictBody.closest('.table-wrapper').scrollTop = decodeDictBody.closest('.table-wrapper').scrollHeight;
}

/**
 * Zeichnet Pixel-Sequenzen live auf den Canvas
 * @param {string} sequence - Die Sequenz der Farbindizes (z.B. "0 1 2")
 * @param {Array} colorPalette - Die globale Farbpalette
 */
function drawPixelsFromSequence(sequence, colorPalette) {
    const canvas = document.getElementById('decode-canvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    
    // Verhindert Unschärfe bei Vergrößerung
    canvas.style.imageRendering = 'pixelated';

    // Sequenz "0 1 2" -> [0, 1, 2]
    const indices = sequence.split(" ").map(Number);
    
    indices.forEach(colorIdx => {
        if (colorPalette[colorIdx]) {
            const colorRGB = colorPalette[colorIdx].split(",");
            
            // Berechne X und Y Koordinate
            const x = window.currentPixelIndex % width;
            const y = Math.floor(window.currentPixelIndex / width);
            
            ctx.fillStyle = `rgb(${colorRGB[0]}, ${colorRGB[1]}, ${colorRGB[2]})`;
            // Zeichne ein 1x1 Pixel großes Rechteck
            ctx.fillRect(x, y, 1, 1);
            
            window.currentPixelIndex++;
        }
    });
}