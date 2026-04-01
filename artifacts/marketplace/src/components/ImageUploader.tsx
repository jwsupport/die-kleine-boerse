import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

const MAX_IMAGES = 4;

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addUrl = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (value.length >= MAX_IMAGES) return;
    onChange([...value, trimmed]);
    setInputValue("");
    setInputVisible(false);
  };

  const removeImage = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addUrl();
    }
    if (e.key === "Escape") {
      setInputVisible(false);
      setInputValue("");
    }
  };

  const openInput = () => {
    setInputVisible(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-slate-400 mb-3 font-semibold">
        Galerie ({value.length} / {MAX_IMAGES})
      </label>

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
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f1f5f9' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='11'%3EFehler%3C/text%3E%3C/svg%3E";
              }}
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              aria-label="Bild entfernen"
            >
              <X className="w-3 h-3 text-slate-700" />
            </button>
          </div>
        ))}

        {value.length < MAX_IMAGES && !inputVisible && (
          <button
            type="button"
            onClick={openInput}
            className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-400"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-medium">URL</span>
          </button>
        )}
      </div>

      {inputVisible && (
        <div className="mt-3 flex gap-2">
          <input
            ref={inputRef}
            type="url"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://… Bild-URL einfügen"
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="button"
            onClick={addUrl}
            className="px-4 py-2 bg-slate-900 text-white text-sm rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Hinzufügen
          </button>
          <button
            type="button"
            onClick={() => { setInputVisible(false); setInputValue(""); }}
            className="px-3 py-2 text-slate-500 text-sm rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="text-[10px] text-slate-400 mt-2 italic">
        Hochauflösende Bilder bevorzugt — bessere Sichtbarkeit in Suchergebnissen.
      </p>
    </div>
  );
}
