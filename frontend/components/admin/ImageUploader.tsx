"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { uploadImage } from "@/lib/upload";

export interface ProductImageItem {
  id?: string;
  url: string;
  altText?: string;
}

export function ImageUploader({
  images,
  onChange,
  token,
  productId,
}: {
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  token: string | null;
  /** When set, add/delete/reorder persist immediately to the product's images. */
  productId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const files = Array.from(fileList);
      const next = [...images];
      for (const file of files) {
        const { url } = await uploadImage(file, token);
        if (productId) {
          const created = await api.post<{ id: string; url: string; altText: string | null }>(
            `/products/${productId}/images`,
            { url },
            token
          );
          next.push({ id: created.id, url: created.url, altText: created.altText ?? "" });
        } else {
          next.push({ url, altText: "" });
        }
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeAt(index: number) {
    const img = images[index];
    if (productId && img.id) {
      try {
        await api.delete(`/products/${productId}/images/${img.id}`, token);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to remove image");
        return;
      }
    }
    onChange(images.filter((_, i) => i !== index));
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    if (productId) {
      const ids = next.map((img) => img.id).filter((id): id is string => !!id);
      try {
        await api.patch(`/products/${productId}/images/reorder`, { order: ids }, token);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to reorder images");
      }
    }
  }

  function setAlt(index: number, altText: string) {
    const next = [...images];
    next[index] = { ...next[index], altText };
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.id ?? img.url + i} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.altText || ""} className="aspect-square w-full object-contain p-2" />
            <div className="flex items-center justify-between gap-1 border-t border-slate-100 bg-slate-50 px-1.5 py-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:bg-white hover:text-ink disabled:opacity-30">
                <ArrowLeft size={13} />
              </button>
              <span className="text-[10px] font-medium text-ink-soft">{i + 1}</span>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded p-1 text-slate-400 hover:bg-white hover:text-ink disabled:opacity-30">
                <ArrowRight size={13} />
              </button>
              <button type="button" onClick={() => removeAt(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={13} />
              </button>
            </div>
            <input
              value={img.altText || ""}
              onChange={(e) => setAlt(i, e.target.value)}
              placeholder="Alt text"
              className="w-full border-t border-slate-100 px-2 py-1 text-[11px] text-ink outline-none focus:bg-slate-50"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-brand-red hover:text-brand-red disabled:opacity-60"
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
          <span className="text-[11px] font-medium">{uploading ? "Uploading…" : "Add image"}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
