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
 * Fügt eine neue Zeile in die Tabelle hinzu
 * Ist aufgerufen in runLZW
 *
 * @param {String} code
 * @param {String} pattern
 */
function addDictRowToUI(code, pattern) {
  const row =
    '<tr class="new-row"><td>' + code + "</td><td>" + pattern + "</td></tr>";
  const dictBody = document.getElementById("dict-body");
  const tableWrapper = document.querySelector(".table-wrapper");

  dictBody.insertAdjacentHTML("beforeend", row);
  if (tableWrapper) {
    tableWrapper.scrollTop = tableWrapper.scrollHeight;
  }
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

  if (code == 256 || code == 257) {
    chip.classList.add("chip-control");
    if (code == 256) chip.innerText = "CLEAR";
    if (code == 257) chip.innerText = "END";
  } else if (code > 257) {
    chip.classList.add("chip-compressed");
  } else {
    chip.classList.add("chip-single");
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
