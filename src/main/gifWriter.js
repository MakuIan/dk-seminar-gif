/**
 * ============================================================================
 * DATEI: ui.js
 * ============================================================================
 * BESCHREIBUNG:
 * Komprimiert ein Bild in Gif Format
 * ============================================================================
 */

/**
 * Nimmt das Ergebnis von runLZW und verpackt es binaer
 *
 * @param {number} width
 * @param {number} height
 * @param {Array<string>} palette
 * @param {Array<number>} lzwCodes
 * @returns {Blob} - Die fertige GIF-Datei als Blob
 */
function createGifBlob(width, height, palette, lzwCodes) {
  const byteBuilder = [];

  console.group("Byte-Schreibfunktionen:");
  // 0xff Bitmaske: Behält nur die unteren 8 Bits (ein Byte) und schneidet alles darüber ab.
  const writeByte = (value) => {
    byteBuilder.push(value & 0xff);
  };

  // Word(2 Bytes) schreiben (little Endian)
  const writeWord = (value) => {
    writeByte(value & 0xff);
    writeByte((value >> 8) & 0xff);
  };

  const writeString = (str) => {
    for (let i = 0; i < str.length; i++) {
      writeByte(str.charCodeAt(i));
    }
  };

  // Header
  writeString("GIF89a");
  // logical screen descriptor
  writeWord(width);
  writeWord(height);

  /* 
  Bit 7: global color table flag, gibt es eine globale farbpalette (1) 
  Bit 4-6 color resolution (7 = 111)
  Bit 3 sort flag, ist die Farbpalette sortiert (0)
  Bit 0-2 size of global color table (7 = 111)
  */
  writeByte(0b11110111);
  writeByte(0); // Background Color Index
  writeByte(0); // Pixel Aspect Ratio

  /* 
  Global Color Table
  */
  for (let i = 0; i < 256; i++) {
    if (i < palette.length) {
      const [r, g, b] = palette[i].split(",").map(Number);
      writeByte(r);
      writeByte(g);
      writeByte(b);
    } else if (i < 256) {
      // Auffuellen mit Schwarz
      writeByte(0);
      writeByte(0);
      writeByte(0);
    }
  }

  // Image Descriptor
  writeByte(0x2c); //Seperator
  writeWord(0); // Image Left Position
  writeWord(0); // Image Top Position
  writeWord(width);
  writeWord(height);
  writeByte(0);

  const minCodeSize = 8;
  writeByte(minCodeSize);

  const packedBytes = packLZWCodes(lzwCodes, minCodeSize);

  for (let i = 0; i < packedBytes.length; i += 256) {
    const chunk = packedBytes.slice(i, i + 256);
    writeByte(chunk.length);
    chunk.forEach((byte) => writeByte(byte));
  }
  writeByte(0); // Block-Terminator

  writeByte(0x3b); // GIF Trailer

  console.log(
    `GIF erfolgreich erstellt. Gesamtgröße: ${byteBuilder.length} Bytes`
  );

  return new Blob([new Uint8Array(byteBuilder)], { type: "image/gif" });
}
/*
Wandelt die LZW Codes in ein bitsream um
*/
function packLZWCodes(lzwCodes, minCodeSize) {
  console.log("%c=== START LZW PACKING ===", "color: lime; font-weight: bold;");
  const bytes = [];
  let bitAccumulator = 0; //Akkumulator in dem Bits geworfen werden
  let bitCount = 0; //Zaehlt wie voll der Akkumulator ist
  let currentCodeSize = minCodeSize + 1;
  let nextBump = 1 << currentCodeSize;

  let dictionarySize = (1 << minCodeSize) + 2;

  for (let i = 0; i < lzwCodes.length; i++) {
    let code = lzwCodes[i];

    console.groupCollapsed(
      `Schritt ${i} | Code: ${code} (Größe: ${currentCodeSize} bits)`
    );

    const codeBinary = code.toString(2).padStart(currentCodeSize, "0");
    console.log(`📥 Input:    ${code} \tBinär: ${codeBinary}`);
    console.log(
      `   Status vor Add:  Akku: ${bitAccumulator.toString(2)} (${bitCount} Bits)`
    );

    bitAccumulator |= code << bitCount;
    bitCount += currentCodeSize;

    console.log(
      `   Status nach Add: Akku: ${bitAccumulator.toString(2)} (${bitCount} Bits)`
    );

    while (bitCount >= 8) {
      const byte = bitAccumulator & 0xff;
      const byteBinary = byte.toString(2).padStart(8, "0");

      console.log(
        `   📦 %cBYTE OUTPUT: 0x${byte.toString(16).toUpperCase()} (${byteBinary})`,
        "color: orange"
      );

      bytes.push(byte);
      bitAccumulator >>= 8;
      bitCount -= 8;
      console.log(
        `      Rest im Akku: ${bitAccumulator.toString(2)} (${bitCount} Bits übrig)`
      );
    }

    if (code === 1 << minCodeSize) {
      console.log("%c   🔄 CLEAR CODE - Reset Dictionary Size", "color: cyan");
      currentCodeSize = minCodeSize + 1;
      nextBump = 1 << currentCodeSize;
      dictionarySize = (1 << minCodeSize) + 2;
    } else {
      dictionarySize++;
      if (dictionarySize >= nextBump && currentCodeSize < 12) {
        console.log(
          `   📈 BUMP SIZE: Bit-Länge erhöht auf ${currentCodeSize + 1}`
        );
        currentCodeSize++;
        nextBump = 1 << currentCodeSize;
      }
    }
  }
  //Restbytes
  if (bitCount > 0) {
    console.log(
      `🏁 Letzte Bits schreiben: 0x${(bitAccumulator & 0xff).toString(16)}`
    );
    bytes.push(bitAccumulator & 0xff);
  }
  console.log("%c=== END PACKING ===", "color: lime;");
  console.log(bytes);
  return bytes;
}
