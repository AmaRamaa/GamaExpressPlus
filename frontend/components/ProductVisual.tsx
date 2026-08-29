"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { ZoomIn, X, ChevronLeft, ChevronRight, Search } from "lucide-react";

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
  magnify = false,
  priority = false,
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
  // Hover-to-zoom lens (desktop/pointer devices only -- there's no useful
  // "hover" on touch, where the full-screen lightbox is the way to inspect
  // detail instead). Opt-in per usage so tiny card/cart thumbnails don't
  // get a magnifier that makes no sense at that size.
  magnify?: boolean;
  // The above-the-fold hero shot (product detail page) shouldn't be lazy --
  // it's usually the page's LCP element, so deferring it makes the page feel
  // slower to load, not faster. Every other usage (grid/list cards, hover
  // previews, thumbnail strips) is off-screen more often than not and should
  // stay lazy so a page of 16 products doesn't fire 16 full downloads at once.
  priority?: boolean;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lensPos, setLensPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cfg = visuals[categorySlug] || fallback;
  const gradId = `grad-${categorySlug}-${variant}`;
  const gallery = images && images.length > 1 ? images : null;
  const ZOOM = 2.5;
  const LENS_RADIUS = 130;

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!magnify || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

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
        <div
          ref={containerRef}
          className={`group/visual relative h-full w-full overflow-hidden ${fit === "contain" ? "bg-surface-muted" : ""} ${className}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setLensPos(null)}
        >
          <img
            src={imageUrl}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
          />
          {magnify && lensPos && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden sm:block"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${ZOOM * 100}%`,
                backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                backgroundRepeat: "no-repeat",
                clipPath: `circle(${LENS_RADIUS}px at ${lensPos.x}% ${lensPos.y}%)`,
              }}
            >
              <div
                className="absolute rounded-full border-2 border-white shadow-lifted"
                style={{
                  width: LENS_RADIUS * 2,
                  height: LENS_RADIUS * 2,
                  left: `calc(${lensPos.x}% - ${LENS_RADIUS}px)`,
                  top: `calc(${lensPos.y}% - ${LENS_RADIUS}px)`,
                }}
              />
            </div>
          )}
          {magnify && !lensPos && (
            <div className="pointer-events-none absolute bottom-2 left-2 hidden items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-ink-soft opacity-0 shadow-soft transition-opacity sm:flex sm:group-hover/visual:opacity-100">
              <Search size={11} /> Hover to zoom
            </div>
          )}
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
              decoding="async"
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
