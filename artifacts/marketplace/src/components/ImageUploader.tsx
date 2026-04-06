import { useRef } from "react";
import { X, ImageIcon } from "lucide-react";
import { useT } from "@/lib/i18n";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.82;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({ value, onChange, maxImages = 4 }: ImageUploaderProps) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = maxImages - value.length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, remaining);
    if (!files.length) return;
    const compressed = await Promise.all(files.map(compressImage));
    onChange([...value, ...compressed]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const openPicker = () => {
    if (remaining > 0) fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold">
          {t.uploader_gallery} ({value.length} / {maxImages})
        </label>
        <span className="text-[10px] text-slate-400">
          JPG · PNG · WEBP
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-4 gap-3">
        {value.map((url, idx) => (
          <div
            key={idx}
            className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group"
          >
            <img
              src={url}
              alt={`Bild ${idx + 1}`}
              className="object-cover w-full h-full"
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/95 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
              aria-label="Bild entfernen"
            >
              <X className="w-3.5 h-3.5 text-slate-700" />
            </button>
            <div className="absolute bottom-1.5 left-1.5 bg-black/40 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
              {idx + 1}
            </div>
          </div>
        ))}

        {Array.from({ length: remaining }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="aspect-square border border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50/50"
          >
            <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="10" width="36" height="28" rx="4" stroke="#cbd5e1" strokeWidth="1.5" fill="#f8fafc"/>
              <circle cx="17" cy="20" r="3.5" stroke="#cbd5e1" strokeWidth="1.5"/>
              <path d="M6 32l9-8 7 7 5-4 9 9" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <button
          type="button"
          onClick={openPicker}
          className="mt-3 w-full py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-all text-slate-400 hover:text-slate-600"
        >
          <ImageIcon className="w-7 h-7" />
          <span className="text-sm font-medium">Bilder vom Gerät hochladen</span>
          <span className="text-[11px] text-slate-400">Bis zu {maxImages} Fotos · JPG, PNG, WEBP</span>
        </button>
      )}

      {value.length > 0 && remaining > 0 && (
        <p className="text-[10px] text-slate-400 mt-2 italic">
          Noch {remaining} {remaining === 1 ? "Foto" : "Fotos"} möglich — nutze den Button unten
        </p>
      )}
    </div>
  );
}
