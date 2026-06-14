/**
 * Client-side image compression.
 *
 * Menu photos straight from a phone camera are often 4-12 MP. Sending those raw
 * to a vision model is slow (and risks the serverless function timing out), so we
 * downscale to a sane max dimension and re-encode as JPEG before upload.
 */

export interface CompressOptions {
  /** Longest edge of the output image, in pixels. */
  maxDimension?: number;
  /** JPEG quality, 0–1. */
  quality?: number;
  /** Skip work entirely if the source is already small enough (bytes). */
  skipUnderBytes?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1536,
  quality: 0.8,
  skipUnderBytes: 300 * 1024, // 300 KB
};

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

async function decode(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  // Prefer createImageBitmap: it's faster and can honor EXIF orientation.
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fall through to the <img> path.
    }
  }

  const dataUrl = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not decode the image."));
    el.src = dataUrl;
  });
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    cleanup: () => {},
  };
}

/**
 * Compress an image file into a JPEG data URL.
 * Falls back to the original (as a data URL) if anything goes wrong.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  const { maxDimension, quality, skipUnderBytes } = { ...DEFAULTS, ...options };

  // Tiny files: just read them as-is, compression won't help.
  if (file.size <= skipUnderBytes) {
    return readAsDataUrl(file);
  }

  try {
    const { source, width, height, cleanup } = await decode(file);

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      cleanup();
      return readAsDataUrl(file);
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, targetW, targetH);
    cleanup();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) {
      return readAsDataUrl(file);
    }

    // If compression somehow produced a larger file, keep the original.
    if (blob.size >= file.size) {
      return readAsDataUrl(file);
    }
    return readAsDataUrl(blob);
  } catch {
    return readAsDataUrl(file);
  }
}
