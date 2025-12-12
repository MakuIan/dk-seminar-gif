/**
 * Initialisiert die Woerterbuch Tabelle im UI
 *
 * @param {Objekt} Woerterbuch
 */
function setWoerterbuchTabelle(Woerterbuch) {
  dictBody.innerHTML = Object.entries(Woerterbuch)
    .map(([key, value]) => {
      if (key === "clear") return `<tr><td>CLEAR</td><td>${value}</td></tr>`; // ÄNDERUNG
      if (key === "end")   return `<tr><td>END</td><td>${value}</td></tr>`;   // ÄNDERUNG
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
  if (pattern === 257) pattern = "END";   // ÄNDERUNG

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
    chip.innerText = "END";   // ÄNDERUNG
  } else if (code > 257) {
    chip.classList.add("chip-compressed");
    chip.innerText = code;    // ÄNDERUNG
  } else {
    chip.classList.add("chip-single");
    chip.innerText = code;    // ÄNDERUNG
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
      resetBtn.disabled = false;
      startBtn.disabled = false;
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
 * Description placeholder
 *
 * @param {*} x
 * @param {*} y
 */
function updateHighlighterPosition(x, y) {
  // TODO Implement highlighter position update
}
