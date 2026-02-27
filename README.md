# GIF Compression Visualizer

Ein interaktives Web-Tool zur Visualisierung des LZW-Algorithmus (Lempel-Ziv-Welch) im Kontext des GIF-Dateiformats. Entwickelt im Rahmen des Kurses "Aktuelle Themen der Angewandten Informatik: Datenkompression".

## 🚀 Inbetriebnahme

Da es sich um eine reine Web-Applikation handelt, ist keine komplexe Installation notwendig. Folgen Sie diesen Schritten:

1. **Entpacken:** Stellen Sie sicher, dass alle Projektdateien (HTML, CSS, JS) extrahiert wurden.
2. **Starten:** Öffnen Sie die Datei `index.html` in einem modernen Webbrowser.
   * *Empfehlung:* Nutzen Sie einen lokalen Webserver (z. B. Live Server Extension in VS Code oder `python -m http.server`), um potenzielle CORS-Probleme beim Laden lokaler Bilder zu vermeiden.
3. **Anzeige:** Navigieren Sie im Browser zu der entsprechenden Adresse (standardmäßig meist `http://localhost:5500` oder `http://127.0.0.1:8000`).

## 🌓 UI-Empfehlung

Für die optimale Darstellung der Benutzeroberfläche und eine korrekte Syntax-Hervorhebung des Algorithmus wird dringend empfohlen, den Browser im **Dark Mode** zu betreiben. Die UI-Elemente und Kontraste sind spezifisch auf ein dunkles Farbschema optimiert.

## 🛠 Bedienung

1. **Upload:** Klicken Sie auf "Durchsuchen...", um ein Bild (vorzugsweise kleine GIFs oder PNGs) hochzuladen.
2. **Analyse:** Das Tool zeigt automatisch das Pixel-Raster und die extrahierte Farbtabelle an.
3. **Simulation:** Starten Sie die Kompression über den Button "Demo Starten". Die Geschwindigkeit kann während des Prozesses über den Regler angepasst werden.
4. **Dekompression:** Nach Abschluss der Kompression kann über "Dekodierung anzeigen" die verlustfreie Rekonstruktion verifiziert werden.

---
**Entwickelt von:** Kristijan Kreso & Mark Ian Braun  
**Institution:** Johann Wolfgang Goethe-Universität Frankfurt am Main