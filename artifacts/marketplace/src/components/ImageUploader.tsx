import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { UploadCloud, X, Link2, Loader2, ImageIcon } from "lucide-react";
import { useT } from "@/lib/i18n";

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

function toDisplayUrl(value: string): string {
  if (!value) return "";
  if (value.startsWith("/objects/")) return `${BASE}/api/storage${value}`;
  return value;
}

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

type Tab = "upload" | "url";

export function ImageUploader({ value, onChange, maxImages = 4 }: ImageUploaderProps) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile } = useUpload({
    onError: (err) => setUploadError(err.message),
  });

  const canAddMore = value.length < maxImages;

  const processFiles = useCallback(
    async (files: File[]) => {
      setUploadError(null);
      const slots = maxImages - value.length;
      const allowed = files.slice(0, slots);
      if (allowed.length === 0) return;

      setUploadingCount((n) => n + allowed.length);
      const results: string[] = [];

      for (const file of allowed) {
        if (!file.type.startsWith("image/")) {
          setUploadError("Nur Bilddateien erlaubt (jpg, png, webp …)");
          setUploadingCount((n) => n - 1);
          continue;
        }
        const result = await uploadFile(file);
        setUploadingCount((n) => n - 1);
        if (result?.objectPath) {
          results.push(result.objectPath);
        }
      }

      if (results.length > 0) {
        onChange([...value, ...results]);
      }
    },
    [value, onChange, maxImages, uploadFile]
  );

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const addUrlImage = () => {
    const url = urlInput.trim();
    if (!url || value.includes(url)) return;
    onChange([...value, url]);
    setUrlInput("");
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const isUploading = uploadingCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">
          {t.uploader_gallery ?? "Fotos"}
        </label>
        <span className="text-xs text-slate-400">
          {value.length}/{maxImages}
        </span>
      </div>

      {(value.length > 0 || isUploading) && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
              <img
                src={toDisplayUrl(url)}
                alt={`Bild ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                }}
              />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] uppercase tracking-widest font-bold bg-slate-900/70 text-white px-1.5 py-0.5 rounded-full pointer-events-none">
                  Titelbild
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="w-3 h-3 text-slate-700" />
              </button>
            </div>
          ))}
          {isUploading &&
            Array.from({ length: uploadingCount }).map((_, i) => (
              <div key={`uploading-${i}`} className="aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            ))}
        </div>
      )}

      {canAddMore && (
        <div>
          <div className="flex gap-1 mb-3">
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === "upload"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Hochladen
            </button>
            <button
              type="button"
              onClick={() => setTab("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === "url"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              Bild-URL
            </button>
          </div>

          {tab === "upload" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all select-none ${
                isDragging
                  ? "border-slate-400 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              } ${isUploading ? "pointer-events-none" : ""}`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
                  <p className="text-sm text-slate-500">Wird hochgeladen…</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-700 font-medium">
                      Bilder hierher ziehen oder{" "}
                      <span className="underline underline-offset-2">auswählen</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      JPG, PNG, WEBP · max. 10 MB · noch {maxImages - value.length}{" "}
                      Foto{maxImages - value.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleFileInput}
              />
            </div>
          )}

          {tab === "url" && (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/bild.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrlImage();
                  }
                }}
                className="flex-1 p-4 bg-slate-50 border border-transparent rounded-xl focus:ring-2 focus:ring-slate-200 outline-none text-slate-900 placeholder:text-slate-400 text-sm"
              />
              <button
                type="button"
                onClick={addUrlImage}
                disabled={!urlInput.trim()}
                className="px-5 py-4 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all disabled:bg-slate-200 disabled:text-slate-400"
              >
                Hinzufügen
              </button>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-500 mt-1">{uploadError}</p>
      )}
    </div>
  );
}
