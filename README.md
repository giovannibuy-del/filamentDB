# FilamentDB 3D Printer Spooler

Eine Electron-Desktopanwendung für Windows, mit der MakerWorld-Links per Drag & Drop importiert, als Druckaufträge gespeichert und mehreren 3D-Druckern zugewiesen werden können.

## Funktionen

- MakerWorld-Link per Drag & Drop oder URL-Eingabe importieren.
- Titel, Beschreibung und Vorschaubild aus MakerWorld-Metadaten laden.
- Druckaufträge Druckern zuweisen und in einer Warteschlange verwalten.
- Statuswechsel für Aufträge: `queued`, `printing`, `done`.
- Druckerprofile in einem separaten GUI-Bereich hinzufügen, bearbeiten und löschen.
- Lokale Persistenz über Electron `userData` als `spooler-data.json`.
- Build-Skripte für portable Windows-EXE und NSIS-Installer.

## Entwicklung

```bash
npm install
npm start
```

## Tests

```bash
npm test
```

## Windows-EXE erstellen

Portable EXE:

```bash
npm run build:win
```

Installer:

```bash
npm run build:win:installer
```

Die erzeugten Artefakte liegen anschließend im Ordner `dist/`.
