"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

export default function PublicRequestPage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const prayer = useQuery(api.prayers.getByShareId, { shareId });
  const incrementPrayed = useMutation(api.publicPrayers.incrementPrayedFor);

  const [hasPrayed, setHasPrayed] = useState(false);
  const [justPrayed, setJustPrayed] = useState(false);

  useEffect(() => {
    // Check localStorage to prevent spam clicking
    const stored = localStorage.getItem(`prayed-${shareId}`);
    if (stored) {
      setHasPrayed(true);
    }
  }, [shareId]);

  async function handlePray() {
    if (hasPrayed) return;
    await incrementPrayed({ shareId });
    localStorage.setItem(`prayed-${shareId}`, "true");
    setHasPrayed(true);
    setJustPrayed(true);
  }

  if (prayer === undefined) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <p className="text-brand-muted">Loading...</p>
      </div>
    );
  }

  if (prayer === null) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
        <div className="text-center">
          <span className="text-5xl block mb-4">🙏</span>
          <h1 className="text-xl font-bold text-brand-white mb-2">
            Prayer Request Not Found
          </h1>
          <p className="text-brand-muted text-sm">
            This prayer request may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <span className="text-5xl block mb-4">🙏</span>
          <h1 className="text-xl font-bold text-brand-white mb-1">
            Prayer Request
          </h1>
          <p className="text-brand-muted text-sm">
            Someone is asking for prayer
          </p>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-xl p-6 space-y-4">
          <p className="text-brand-white text-lg leading-relaxed">
            {prayer.text}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-brand-dark px-2 py-1 rounded text-brand-muted">
              {prayer.category}
            </span>
            {prayer.person && (
              <span className="bg-brand-dark px-2 py-1 rounded text-brand-gold">
                For: {prayer.person}
              </span>
            )}
            <span className="text-brand-muted">
              {formatDate(prayer.createdAt)}
            </span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <button
            onClick={handlePray}
            disabled={hasPrayed}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
              hasPrayed
                ? "bg-brand-gold/10 text-brand-gold cursor-default"
                : "bg-brand-gold text-brand-black hover:bg-brand-gold-light"
            }`}
          >
            {justPrayed
              ? "Thank You for Praying!"
              : hasPrayed
                ? "You Prayed for This"
                : "I'm Praying for This"}
          </button>

          <p className="text-brand-muted text-sm">
            {prayer.prayedForCount + (justPrayed ? 1 : 0)}{" "}
            {prayer.prayedForCount + (justPrayed ? 1 : 0) === 1
              ? "person is"
              : "people are"}{" "}
            praying
          </p>
        </div>

        <div className="text-center pt-4 border-t border-brand-border">
          <p className="text-brand-muted text-xs mb-2">
            Want your own prayer journal?
          </p>
          <a
            href="/"
            className="text-brand-gold text-sm hover:text-brand-gold-light"
          >
            Try The Prayer Room - It&apos;s Free
          </a>
        </div>

        <footer className="text-center">
          <p className="text-brand-muted text-xs">
            &copy; {new Date().getFullYear()} The Prayer Room. A{" "}
            <a
              href="https://tvrapp.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-gold hover:text-brand-gold-light"
            >
              TVR App Store
            </a>{" "}
            Product.
          </p>
        </footer>
      </div>
    </div>
  );
}
