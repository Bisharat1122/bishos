/** Ambient tracks offered when a focus timer starts. Add more entries here and
 * drop the matching file in /public/music — the picker and player pick them up
 * automatically. `src` is a URL under /public. */
export type FocusTrack = { id: string; title: string; src: string };

export const FOCUS_TRACKS: FocusTrack[] = [
  {
    id: "calm-humming-nasheed-rain",
    title: "Calm Humming Nasheed · Rain Sounds",
    src: "/music/calm-humming-nasheed-rain.mp3",
  },
];

export const DEFAULT_TRACK_ID = FOCUS_TRACKS[0]?.id ?? "";
