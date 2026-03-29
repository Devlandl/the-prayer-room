"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type Phase = "adoration" | "confession" | "thanksgiving" | "supplication";

interface ACTSPrompts {
  adoration: { scripture: string; prompt: string };
  confession: { scripture: string; prompt: string };
  thanksgiving: { scripture: string; prompt: string };
  supplication: { scripture: string; prompt: string };
}

const PHASE_ORDER: Phase[] = [
  "adoration",
  "confession",
  "thanksgiving",
  "supplication",
];

const PHASE_LABELS: Record<Phase, string> = {
  adoration: "Adoration",
  confession: "Confession",
  thanksgiving: "Thanksgiving",
  supplication: "Supplication",
};

const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  adoration: "Praise God for who He is",
  confession: "Reflect and repent honestly",
  thanksgiving: "Give thanks for His blessings",
  supplication: "Bring your requests to God",
};

const DURATION_OPTIONS = [5, 10, 15, 20];

export default function SessionPage() {
  const [mode, setMode] = useState<"setup" | "session" | "complete">("setup");
  const [duration, setDuration] = useState(10);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prompts, setPrompts] = useState<ACTSPrompts | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createSession = useMutation(api.sessions.create);

  const phaseTime = Math.floor((duration * 60) / 4);
  const currentPhase = PHASE_ORDER[currentPhaseIndex];

  const endSession = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await createSession({
      duration,
      topic: topic.trim() || undefined,
    });
    setMode("complete");
  }, [createSession, duration, topic]);

  useEffect(() => {
    if (mode !== "session") return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          endSession();
          return 0;
        }
        return prev - 1;
      });

      setPhaseSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setCurrentPhaseIndex((idx) => {
            if (idx < 3) {
              setPhaseSecondsRemaining(phaseTime);
              return idx + 1;
            }
            return idx;
          });
          return phaseTime;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode, phaseTime, endSession]);

  async function handleStart() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || undefined,
          duration,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate session");
      }

      const data: ACTSPrompts = await res.json();
      setPrompts(data);
      setSecondsRemaining(duration * 60);
      setPhaseSecondsRemaining(phaseTime);
      setCurrentPhaseIndex(0);
      setMode("session");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // --- SETUP MODE ---
  if (mode === "setup") {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-brand-white">Prayer Time</h1>
        <p className="text-brand-muted">
          Start a guided prayer session using the ACTS model - Adoration,
          Confession, Thanksgiving, Supplication. Pick a duration and optionally
          enter a topic or verse.
        </p>

        <div className="bg-brand-card border border-brand-border rounded-xl p-6 space-y-5">
          <div>
            <label className="text-sm text-brand-muted mb-2 block">
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-lg font-medium text-sm transition-colors ${
                    duration === d
                      ? "bg-brand-gold text-brand-black"
                      : "bg-brand-dark border border-brand-border text-brand-muted hover:text-brand-white"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-brand-muted mb-2 block">
              Topic or verse (optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='e.g. gratitude, Psalm 23, patience'
              className="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-lg text-brand-white placeholder-brand-muted focus:outline-none focus:border-brand-gold"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 bg-brand-gold text-brand-black font-bold rounded-xl text-lg hover:bg-brand-gold-light transition-colors disabled:opacity-50"
          >
            {loading ? "Preparing your session..." : "Start Session"}
          </button>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-6">
          <h3 className="font-semibold text-brand-white mb-3">
            What is ACTS?
          </h3>
          <div className="space-y-2 text-sm text-brand-muted">
            <p>
              <span className="text-brand-gold font-medium">A</span>doration -
              Praise God for who He is
            </p>
            <p>
              <span className="text-brand-gold font-medium">C</span>onfession -
              Honestly reflect and repent
            </p>
            <p>
              <span className="text-brand-gold font-medium">T</span>hanksgiving
              - Give thanks for His blessings
            </p>
            <p>
              <span className="text-brand-gold font-medium">S</span>upplication
              - Bring your requests and needs
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- SESSION MODE ---
  if (mode === "session" && prompts) {
    const currentPrompt = prompts[currentPhase];
    const progressPercent =
      ((duration * 60 - secondsRemaining) / (duration * 60)) * 100;

    return (
      <div className="min-h-screen bg-brand-black flex flex-col">
        {/* Timer bar at top */}
        <div className="bg-brand-dark border-b border-brand-border px-4 py-3">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <span className="text-brand-gold font-mono text-lg font-bold">
              {formatTime(secondsRemaining)}
            </span>
            <div className="flex gap-1">
              {PHASE_ORDER.map((phase, idx) => (
                <div
                  key={phase}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentPhaseIndex
                      ? "bg-brand-gold"
                      : idx < currentPhaseIndex
                        ? "bg-brand-gold/40"
                        : "bg-brand-border"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={endSession}
              className="text-sm text-brand-muted hover:text-brand-white transition-colors"
            >
              End Session
            </button>
          </div>
          {/* Progress bar */}
          <div className="max-w-xl mx-auto mt-2">
            <div className="h-1 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-gold transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Phase content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-xl w-full space-y-8 text-center">
            <div>
              <p className="text-brand-gold text-sm font-medium uppercase tracking-wide mb-1">
                {PHASE_LABELS[currentPhase]}
              </p>
              <p className="text-brand-muted text-xs">
                {PHASE_DESCRIPTIONS[currentPhase]}
              </p>
              <p className="text-brand-muted text-xs mt-1 font-mono">
                {formatTime(phaseSecondsRemaining)} remaining in this phase
              </p>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-6 space-y-4">
              <p className="text-brand-gold/80 text-sm italic leading-relaxed">
                {currentPrompt.scripture}
              </p>
              <div className="border-t border-brand-border pt-4">
                <p className="text-brand-white leading-relaxed">
                  {currentPrompt.prompt}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- COMPLETE MODE ---
  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="text-6xl block">&#10003;</span>
        <h2 className="text-2xl font-bold text-brand-white">
          Session Complete
        </h2>
        <p className="text-brand-muted">
          Beautiful time in prayer. {duration} minutes well spent with the Lord.
        </p>
        <p className="text-brand-gold text-sm italic">
          &quot;The Lord is near to all who call on him.&quot; - Psalm 145:18
        </p>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => {
              setMode("setup");
              setPrompts(null);
              setCurrentPhaseIndex(0);
            }}
            className="w-full py-3 bg-brand-gold text-brand-black font-semibold rounded-xl hover:bg-brand-gold-light transition-colors"
          >
            Start Another Session
          </button>
          <a
            href="/app"
            className="w-full py-3 border border-brand-border text-brand-muted rounded-xl hover:text-brand-white transition-colors block"
          >
            Back to My Prayers
          </a>
        </div>
      </div>
    </div>
  );
}
