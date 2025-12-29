/**
 * BitPackingVisualizer - Visualisiert die Bit-Packing-Logik des LZW-Kompressionsalgorithmus
 *
 * Diese Klasse visualisiert, wie ein LZW-Encoder Eingabedaten in Bits verpackt und in Bytes ausgibt.
 * Sie zeigt die Akkumulation von Bits und die Ausgabe von Bytes, wenn genügend Bits angesammelt wurden.
 *
 * Features:
 * - Visuelle Darstellung des Bit-Akkumulators
 * - Animation der Bit-zu-Byte-Konvertierung
 * - Farbcodierung für verschiedene Codewörter
 * - Automatische Anpassung der Code-Größe
 *
 * Die Klasse verwendet DOM-Manipulation, um den Bit-Packing-Prozess in Echtzeit anzuzeigen.
 */
class BitPackingVisualizer {
  /**
   * Erstellt eine neue BitPackingVisualizer-Instanz
   * Initialisiert die Farbpalette und setzt den Zustand zurück
   */
  constructor() {
    this.colorPalette = [
      "#FF4757", // Rot
      "#2ED573", // Grün
      "#1E90FF", // Blau
      "#FFA502", // Orange
      "#9B59B6", // Lila
      "#00E5FF", // Cyan
      "#E1B12C" // Gelb
    ];
    this.reset();
  }

  /**
   * Setzt den Visualisierer auf den Ausgangszustand zurück
   * Initialisiert alle Zähler und leert die visuellen Elemente
   */
  reset() {
    this.bitAccumulator = 0;
    this.bitCount = 0;
    this.minCodeSize = 8;
    this.currentCodeSize = 9;
    this.dictionarySize = 512;
    this.nextBump = 258;
    this.stepIndex = 0;

    document.getElementById("bp-val-dec").innerText = "-";
    document.getElementById("bp-val-bin").innerText = "-";
    document.getElementById("bp-val-width").innerText = "-";
    document.getElementById("bp-accumulator").innerHTML = "";
    document.getElementById("bp-byte-output").innerHTML = "";
    document.getElementById("bp-buffer-count").innerText = "0";
  }

  /**
   * Gibt die nächste Farbe aus der Farbpalette zurück
   * @returns {string} Eine CSS-Farbzeichenkette
   */
  getCycleColor() {
    const color = this.colorPalette[this.stepIndex % this.colorPalette.length];
    this.stepIndex++;
    return color;
  }

  /**
   * Verarbeitet ein neues Codewort und aktualisiert die Visualisierung
   * @param {number} code - Das zu verarbeitende Codewort
   */
  processCode(code) {
    const binaryString = code.toString(2).padStart(this.currentCodeSize, "0");
    document.getElementById("bp-val-dec").innerText = code;
    document.getElementById("bp-val-bin").innerText = binaryString;
    const currentColor = this.getCycleColor();
    document.getElementById("bp-val-bin").style.color = currentColor;
    document.getElementById("bp-val-width").innerText = this.currentCodeSize;

    this.bitAccumulator |= code << this.bitCount;
    this.bitCount += this.currentCodeSize;

    const bitsArray = binaryString.split("").reverse();
    this.addBitsToVisualBuffer(bitsArray, currentColor);

    while (this.bitCount >= 8) {
      const byteVal = this.bitAccumulator & 0xff;
      this.bitAccumulator >>= 8;
      this.bitCount -= 8;

      this.triggerCutAnimation(byteVal);
    }

    this.handleDictionaryGrowth(code);
  }

  /**
   * Fügt Bits dem visuellen Puffer hinzu
   * @param {string[]} bitsArray - Array von Bits als Zeichenketten ("0" oder "1")
   * @param {string} color - CSS-Farbe für die Darstellung der Bits
   */
  addBitsToVisualBuffer(bitsArray, color) {
    const container = document.getElementById("bp-accumulator");
    bitsArray.forEach((bitChar) => {
      const el = document.createElement("div");
      el.className = "bit-block bit-enter bit-pending";
      el.innerText = bitChar;
      el.style.borderColor = color;
      el.style.boxShadow = `0 0 5px ${color}`;
      el.dataset.color = color;
      container.appendChild(el);
    });
    this.updateVisualIndices();
  }

  /**
   * Startet die Animation.
   * Greift sich die Bits SOFORT und markiert sie als "locked",
   * damit nachfolgende Aufrufe nicht durcheinander kommen.
   */
  /**
   * Startet die Animation zum Abschneiden von 8 Bits in ein Byte
   * @param {number} byteVal - Der numerische Wert des Bytes (0-255)
   */
  triggerCutAnimation(byteVal) {
    const container = document.getElementById("bp-accumulator");

    const availableBits = Array.from(
      container.querySelectorAll(".bit-block:not(.locked)")
    );

    if (availableBits.length < 8) return;

    const byteBits = availableBits.slice(0, 8);
    byteBits.forEach((b) => b.classList.add("locked"));

    setTimeout(() => {
      const bitColors = byteBits.map((el) => el.dataset.color || "#444");

      byteBits.forEach((el) => el.classList.add("bit-fly-down"));

      setTimeout(() => {
        byteBits.forEach((el) => el.remove());
        this.createOutputChip(byteVal, bitColors);
        this.updateVisualIndices();
      }, 550);
    }, 600);
  }

  /**
   * Erstellt ein visuelles Element für ein ausgegebenes Byte
   * @param {number} byteVal - Der Wert des Bytes (0-255)
   * @param {string[]} bitColors - Array von Farben für die einzelnen Bits
   */
  createOutputChip(byteVal, bitColors) {
    const outBox = document.getElementById("bp-byte-output");
    const chip = document.createElement("div");
    chip.className = "chip-single";
    chip.innerText = "0x" + byteVal.toString(16).toUpperCase().padStart(2, "0");

    if (bitColors.length > 0) {
      let gradientParts = bitColors.map((color, idx) => {
        const start = (idx / 8) * 100;
        const end = ((idx + 1) / 8) * 100;
        return `${color} ${start}%, ${color} ${end}%`;
      });
      const gradientStr = `linear-gradient(to right, ${gradientParts.join(
        ", "
      )})`;
      chip.style.background = `${gradientStr} no-repeat bottom`;
      chip.style.backgroundSize = "100% 5px";
      chip.style.paddingBottom = "8px";
    }

    outBox.appendChild(chip);
    outBox.scrollTop = outBox.scrollHeight;
  }

  /**
   * Aktualisiert die visuellen Indizes und Status der Bit-Blöcke
   * Zeigt an, welche Bits als nächstes in ein Byte verpackt werden
   */
  updateVisualIndices() {
    const container = document.getElementById("bp-accumulator");

    const children = Array.from(
      container.querySelectorAll(".bit-block:not(.locked)")
    );

    document.getElementById("bp-buffer-count").innerText = children.length;

    children.forEach((child, idx) => {
      let label = child.querySelector(".bit-idx");
      if (!label) {
        label = document.createElement("span");
        label.className = "bit-idx";
        child.appendChild(label);
      }
      label.innerText = idx;

      child.classList.remove("bit-ready", "bit-pending");
      if (idx < 8) {
        child.classList.add("bit-ready");
      } else {
        child.classList.add("bit-pending");
      }
    });
  }

  /**
   * Verarbeitet verbleibende Bits im Akkumulator
   * Fügt ggf. Füllbits hinzu, um ein vollständiges Byte zu erhalten
   */
  flush() {
    if (this.bitCount > 0) {
      const byteVal = this.bitAccumulator & 0xff;

      const needed = 8 - this.bitCount;
      const container = document.getElementById("bp-accumulator");

      if (needed > 0) {
        for (let i = 0; i < needed; i++) {
          const el = document.createElement("div");
          el.className = "bit-block bit-pending";
          el.innerText = "0";
          el.style.borderColor = "#555";
          el.style.borderStyle = "dashed";
          el.style.opacity = "0.5";
          el.dataset.color = "transparent";

          const label = document.createElement("span");
          label.className = "bit-idx";
          el.appendChild(label);

          container.appendChild(el);
        }
        this.updateVisualIndices();
      }

      this.triggerCutAnimation(byteVal);

      this.bitAccumulator = 0;
      this.bitCount = 0;
    }
  }

  /**
   * Behandelt die Erweiterung des Wörterbuchs und die Anpassung der Code-Größe
   * @param {number} code - Das aktuelle Codewort
   */
  handleDictionaryGrowth(code) {
    if (code === 256) {
      this.currentCodeSize = 9;
      this.nextBump = 512;
      this.dictionarySize = 258;
      this.nextBump = 1 << this.currentCodeSize;
      this.dictionarySize = (1 << 8) + 2;
    } else {
      this.dictionarySize++;
      if (this.dictionarySize >= this.nextBump && this.currentCodeSize < 12) {
        this.currentCodeSize++;
        this.nextBump = 1 << this.currentCodeSize;
      }
    }
  }
}

window.bitPackerViz = new BitPackingVisualizer();
