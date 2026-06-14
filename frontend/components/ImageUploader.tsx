"use client";

import { useRef, useState } from "react";
import type { TargetLanguage } from "@/lib/types";
import { STRINGS } from "@/lib/i18n";
import { compressImage } from "@/lib/image";

interface Props {
  language: TargetLanguage;
  preview: string | null;
  onSelect: (dataUrl: string) => void;
  onClear: () => void;
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h5L15.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

export default function ImageUploader({ language, preview, onSelect, onClear }: Props) {
  const t = STRINGS[language];
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setProcessing(true);
    try {
      const dataUrl = await compressImage(file);
      onSelect(dataUrl);
    } finally {
      setProcessing(false);
    }
  };

  if (preview) {
    return (
      <div className="preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Menu preview" />
        <div className="preview-bar">
          <span className="disclaimer">
            <span aria-hidden>🍽️</span> {t.dropTitle}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            {t.retake}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`dropzone${drag ? " is-drag" : ""}${processing ? " is-busy" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!processing) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!processing) void handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="dropzone-icon">
        <CameraIcon />
      </div>
      <h3>{t.dropTitle}</h3>
      <p>{processing ? t.compressing : t.dropHint}</p>
      <div className="dropzone-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => cameraRef.current?.click()}
          disabled={processing}
        >
          <CameraIcon /> {t.takePhoto}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => fileRef.current?.click()}
          disabled={processing}
        >
          {t.chooseImage}
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="visually-hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
}
