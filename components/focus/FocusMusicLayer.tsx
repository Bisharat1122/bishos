"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Music, Volume2, VolumeX, X, Play } from "lucide-react";
import { FOCUS_TRACKS, DEFAULT_TRACK_ID } from "@/lib/focusMusic";
import { useFocusTimer } from "./FocusTimerProvider";
import { cn } from "@/lib/utils";

const PREFS_KEY = "bishos.focusMusic.v1";

/** Ambient-music companion for the focus timer. Lives inside the timer provider
 * so it works no matter which screen starts the timer. When a fresh session
 * begins it asks whether to play music; the chosen track loops at the chosen
 * volume while the timer runs, pauses when the timer pauses, and stops when the
 * timer stops. */
export function FocusMusicLayer() {
  const { startSignal, running, active } = useFocusTimer();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [trackId, setTrackId] = useState(DEFAULT_TRACK_ID);
  const [volume, setVolume] = useState(0.6);
  const hydrated = useRef(false);

  const track = FOCUS_TRACKS.find((t) => t.id === trackId) ?? FOCUS_TRACKS[0];

  // remembered preferences (volume + last track), persisted across sessions
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.volume === "number") setVolume(Math.min(1, Math.max(0, p.volume)));
        if (typeof p.trackId === "string" && FOCUS_TRACKS.some((t) => t.id === p.trackId))
          setTrackId(p.trackId);
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ volume, trackId }));
    } catch {
      /* ignore */
    }
  }, [volume, trackId]);

  // a fresh session started somewhere in the app → offer music
  useEffect(() => {
    if (startSignal > 0) setPromptOpen(true);
  }, [startSignal]);

  // keep the audio element in sync with the timer + music state
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (!active) {
      // timer fully stopped → stop and rewind the music, and forget the choice
      el.pause();
      el.currentTime = 0;
      if (musicOn) setMusicOn(false);
      if (promptOpen) setPromptOpen(false);
      return;
    }
    if (musicOn && running) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [active, running, musicOn, promptOpen]);

  // live volume changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // point the element at the selected track
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  const prevVolume = useRef(0.6);
  function toggleMute() {
    if (volume > 0) {
      prevVolume.current = volume;
      setVolume(0);
    } else {
      setVolume(prevVolume.current || 0.6);
    }
  }

  function playChoice() {
    const el = audioRef.current;
    if (el) {
      el.volume = volume;
      // play right away inside the click gesture so autoplay policies allow it
      void el.play().catch(() => {});
    }
    setMusicOn(true);
    setPromptOpen(false);
  }

  return (
    <>
      <audio ref={audioRef} src={track?.src} loop preload="none" />

      {/* ongoing volume control while music plays with the timer */}
      {active && musicOn &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
            <button
              onClick={toggleMute}
              title={volume === 0 ? "Unmute" : "Mute"}
              className="flex h-6 w-6 items-center justify-center rounded-full text-primary hover:bg-muted"
            >
              {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Music className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1.5 w-24 cursor-pointer accent-primary"
              aria-label="Music volume"
            />
          </div>,
          document.body,
        )}

      {promptOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setPromptOpen(false)} />
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Music className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Focus music</p>
                    <p className="text-xs text-muted-foreground">Play something while you focus?</p>
                  </div>
                </div>
                <button
                  onClick={() => setPromptOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="No music"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 px-4 py-4">
                <div className="space-y-1.5">
                  {FOCUS_TRACKS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTrackId(t.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                        trackId === t.id
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border",
                          trackId === t.id ? "border-primary" : "border-muted-foreground/50",
                        )}
                      >
                        {trackId === t.id && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      <span className="flex-1 truncate">{t.title}</span>
                    </button>
                  ))}
                </div>

                {/* volume */}
                <div className="flex items-center gap-2 pt-1">
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer accent-primary"
                    aria-label="Music volume"
                  />
                  <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
                <button
                  onClick={() => setPromptOpen(false)}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  No music
                </button>
                <button
                  onClick={playChoice}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Play className="h-3.5 w-3.5" /> Play
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
