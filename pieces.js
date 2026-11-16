// ✏️ Edit this list to add / change pieces.
// Put the audio files (mp3 / m4a / ogg / wav) in the "audio" folder.
//
//   title     – shown on the card
//   composer  – shown under the title
//   file      – path to the audio file (use null for the built-in demo tune)
//   start     – second where the puzzle excerpt begins
//   length    – length of the excerpt in seconds (it gets cut into puzzle pieces)
//   slice     – (optional) seconds per puzzle piece, default 7
//   emoji     – little icon on the card
window.PIECES = [
  {
    title: "Wedding March",
    composer: "Mendelssohn",
    file: "audio/piece1.mp3",
    start: 0,
    length: 70,
    emoji: "🎻",
  },
  {
    title: "A Midsummer Night's Dream – Overture",
    composer: "Mendelssohn",
    file: "audio/piece2.mp3",
    start: 0,
    length: 70,
    emoji: "🎼",
  },
  {
    title: "The Marriage of Figaro – Overture",
    composer: "Mozart",
    file: "audio/piece3.mp3",
    start: 0,
    length: 70,
    emoji: "🎺",
  },
  {
    title: "Eine kleine Nachtmusik",
    composer: "Mozart",
    file: "audio/piece4.mp3",
    start: 0,
    length: 70,
    emoji: "🪕",
  },
  {
    // Built-in tune so the site works even before you add any audio.
    title: "Ode to Joy (demo)",
    composer: "Beethoven",
    file: null,
    start: 0,
    length: 16,
    slice: 2,
    emoji: "🎹",
  },
];
