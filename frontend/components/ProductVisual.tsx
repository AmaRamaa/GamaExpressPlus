"use client";

import {
  CarFront, Lightbulb, Frame, PanelTop, Package, LucideIcon,
} from "lucide-react";

interface VisualConfig {
  icon: LucideIcon;
  from: string;
  to: string;
}

const visuals: Record<string, VisualConfig> = {
  "bumpers-body-panels": { icon: CarFront, from: "#B30000", to: "#3A1212" },
  "lighting": { icon: Lightbulb, from: "#CA8A04", to: "#422006" },
  "mirrors-glass": { icon: Frame, from: "#0369A1", to: "#082F49" },
  "trim-grilles": { icon: PanelTop, from: "#334155", to: "#0F172A" },
};

const fallback: VisualConfig = { icon: Package, from: "#4B5563", to: "#1F2937" };

export default function ProductVisual({
  categorySlug,
  variant = "primary",
  className = "",
}: {
  categorySlug: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const cfg = visuals[categorySlug] || fallback;
  const Icon = cfg.icon;
  const gradId = `grad-${categorySlug}-${variant}`;

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

      <Icon
        size={variant === "primary" ? 88 : 64}
        strokeWidth={1.25}
        className="relative text-white/90"
      />
    </div>
  );
}
