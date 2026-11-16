# Musical Puzzle 🎼

Listen, then put the slices of a classical piece back in order.

## Add your music
1. Put audio files in `audio/` (e.g. `piece1.mp3`).
2. Edit `pieces.js` – set title, composer, file, and which seconds (`start`, `length`) to use for the puzzle.

## Run locally
Audio loading needs a web server (not double-clicking the file):

    python3 -m http.server 8000   # then open http://localhost:8000

## Publish on GitHub Pages
Push this folder to a repo → Settings → Pages → Deploy from branch `main` / root.
