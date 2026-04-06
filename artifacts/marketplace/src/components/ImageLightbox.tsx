import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({ images, currentIndex, onClose, onNavigate }: ImageLightboxProps) {
  const total = images.length;

  const prev = useCallback(() => {
    onNavigate((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onNavigate]);

  const next = useCallback(() => {
    onNavigate((currentIndex + 1) % total);
  }, [currentIndex, total, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/60 text-sm font-medium tracking-widest">
          {currentIndex + 1} / {total}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Schließen"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main image */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {total > 1 && (
          <button
            onClick={prev}
            className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        <img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Bild ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain rounded-sm select-none"
          draggable={false}
        />

        {total > 1 && (
          <button
            onClick={next}
            className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
            aria-label="Nächstes Bild"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-4"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`w-12 h-12 rounded overflow-hidden border-2 transition-all shrink-0 ${
                i === currentIndex
                  ? "border-white opacity-100 scale-110"
                  : "border-white/20 opacity-50 hover:opacity-75 hover:border-white/50"
              }`}
              aria-label={`Bild ${i + 1}`}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
