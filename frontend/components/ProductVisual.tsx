"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";

interface VisualConfig {
  from: string;
  to: string;
}

const visuals: Record<string, VisualConfig> = {
  "bumpers-body-panels": { from: "#B30000", to: "#3A1212" },
  "lighting": { from: "#CA8A04", to: "#422006" },
  "mirrors-glass": { from: "#0369A1", to: "#082F49" },
  "trim-grilles": { from: "#334155", to: "#0F172A" },
};

const fallback: VisualConfig = { from: "#4B5563", to: "#1F2937" };

export default function ProductVisual({
  categorySlug,
  imageUrl,
  variant = "primary",
  className = "",
  fit = "cover",
  images,
  activeIndex = 0,
  onIndexChange,
}: {
  categorySlug: string;
  imageUrl?: string;
  variant?: "primary" | "secondary";
  className?: string;
  fit?: "cover" | "contain";
  // Optional: the full photo set this image belongs to, so the lightbox can
  // step through them without closing. Omit for single-image contexts
  // (product cards, cart lines, etc.) where there's nothing to switch to.
  images?: string[];
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const cfg = visuals[categorySlug] || fallback;
  const gradId = `grad-${categorySlug}-${variant}`;
  const gallery = images && images.length > 1 ? images : null;

  function showRelative(delta: number) {
    if (!gallery || !onIndexChange) return;
    onIndexChange((activeIndex + delta + gallery.length) % gallery.length);
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowLeft") showRelative(-1);
      else if (e.key === "ArrowRight") showRelative(1);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, activeIndex, gallery]);

  if (imageUrl) {
    return (
      <>
        <div className={`group/visual relative h-full w-full overflow-hidden ${fit === "contain" ? "bg-surface-muted" : ""} ${className}`}>
          <img src={imageUrl} alt="" className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`} />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            aria-label="View full photo"
            className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft transition-opacity sm:opacity-0 sm:group-hover/visual:opacity-100"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {lightboxOpen && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-6"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
              className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            {gallery && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); showRelative(-1); }}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-5"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); showRelative(1); }}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-5"
                >
                  <ChevronRight size={22} />
                </button>
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white">
                  {activeIndex + 1} / {gallery.length}
                </span>
              </>
            )}
            <img
              src={imageUrl}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${cfg.from}, ${cfg.to})` }}
    >
      {/* subtle technical grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="none">
        <defs>
          <pattern id={gradId} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${gradId})`} />
      </svg>

      {/* red accent corner */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rotate-45 bg-white/10" />

      <Image
        src="/emblem-white.png"
        alt=""
        width={900}
        height={945}
        className="relative opacity-90"
        style={{ width: variant === "primary" ? 72 : 52, height: "auto" }}
      />
    </div>
  );
}
