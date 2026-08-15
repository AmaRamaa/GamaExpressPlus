// Client-side (free, no API key) photo processing for the admin product form:
// background removal via an in-browser AI model, plus compositing onto white
// and a watermark -- both are just canvas drawing, no external service.
import { removeBackground } from "@imgly/background-removal";

const WATERMARK_SRC = "/emblem-red.png";
let watermarkImagePromise: Promise<HTMLImageElement> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load processed image")); };
    img.src = url;
  });
}

function getWatermarkImage(): Promise<HTMLImageElement> {
  if (!watermarkImagePromise) watermarkImagePromise = loadImage(WATERMARK_SRC);
  return watermarkImagePromise;
}

export interface ProcessImageOptions {
  removeBg: boolean;
  watermark: boolean;
  onProgress?: (stage: "removing-background" | "compositing") => void;
}

// The quint8 model is the smallest/fastest of the three bundled models --
// this pipeline runs on staff phones during rapid product entry, so speed
// matters more than the last bit of segmentation accuracy.
async function stripBackground(file: File, onProgress?: ProcessImageOptions["onProgress"]): Promise<Blob> {
  onProgress?.("removing-background");
  return removeBackground(file, {
    model: "isnet_quint8",
    output: { format: "image/png" },
  });
}

// For stripping the background off a photo that's already uploaded (the
// per-product "Remove background" button and the site-wide bulk tool both
// start from a URL, not a fresh File from an <input>).
export async function removeBackgroundFromUrl(
  url: string,
  onProgress?: ProcessImageOptions["onProgress"]
): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch the original photo");
  const sourceBlob = await res.blob();
  const file = new File([sourceBlob], "photo.jpg", { type: sourceBlob.type || "image/jpeg" });
  return processImage(file, { removeBg: true, watermark: false, onProgress });
}

export async function processImage(file: File, options: ProcessImageOptions): Promise<Blob> {
  let working: Blob = file;

  if (options.removeBg) {
    working = await stripBackground(file, options.onProgress);
  }

  if (!options.removeBg && !options.watermark) {
    return working;
  }

  options.onProgress?.("compositing");
  const img = await loadImageFromBlob(working);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background removal leaves transparency -- give it a clean white backing
  // so the product doesn't render "floating" on whatever page background
  // happens to be behind it on the storefront.
  if (options.removeBg) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);

  if (options.watermark) {
    const logo = await getWatermarkImage();
    const logoWidth = canvas.width * 0.16;
    const logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth);
    const pad = canvas.width * 0.025;
    ctx.globalAlpha = 0.5;
    ctx.drawImage(logo, canvas.width - logoWidth - pad, canvas.height - logoHeight - pad, logoWidth, logoHeight);
    ctx.globalAlpha = 1;
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not export processed image"))), "image/jpeg", 0.9)
  );
}
