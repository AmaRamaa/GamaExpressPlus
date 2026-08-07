"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function LogoUploader({
  value,
  onChange,
  token,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  token: string | null;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await uploadImage(file, token);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {value ? (
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-contain p-1" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5 text-slate-500 shadow hover:text-red-600"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-brand-red hover:text-brand-red disabled:opacity-60"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
        </button>
      )}
      <div className="text-xs text-ink-soft">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="font-medium text-brand-red hover:underline">
          {value ? "Replace logo" : "Upload logo"}
        </button>
        {error && <p className="mt-0.5 text-red-600">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
