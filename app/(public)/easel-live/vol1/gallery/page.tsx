'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const galleryData = [
  { folder: 'M1', files: Array.from({ length: 10 }, (_, i) => `M1_${i + 1}.jpg`) },
  { folder: 'M2', files: Array.from({ length: 10 }, (_, i) => `M2_${i + 1}.jpg`) },
  { folder: 'M3', files: Array.from({ length: 10 }, (_, i) => `M3_${i + 1}.jpg`) },
  { folder: 'M4', files: Array.from({ length: 10 }, (_, i) => `M4_${i + 1}.jpg`) },
  { folder: 'M5', files: Array.from({ length: 10 }, (_, i) => `M5_${i + 1}.jpg`) },
  { folder: 'M6', files: Array.from({ length: 10 }, (_, i) => `M6_${i + 1}.jpg`) },
  { folder: 'M6.5', files: Array.from({ length: 10 }, (_, i) => `M6.5_${i + 1}.jpg`) },
  { folder: 'M7', files: Array.from({ length: 10 }, (_, i) => `M7_${i + 1}.jpg`) },
  { folder: 'M8', files: Array.from({ length: 10 }, (_, i) => `M8_${i + 1}.jpg`) },
  { folder: 'M9', files: Array.from({ length: 10 }, (_, i) => `M9_${i + 1}.jpg`) },
  { folder: 'M10', files: Array.from({ length: 10 }, (_, i) => `M10_${i + 1}.jpg`) },
  { folder: 'M11', files: Array.from({ length: 10 }, (_, i) => `M11_${i + 1}.jpg`) },
  { folder: 'M12', files: Array.from({ length: 10 }, (_, i) => `M12_${i + 1}.jpg`) },
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function Vol1GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = useMemo(() => {
    return galleryData.flatMap(({ folder, files }) => {
      const picked = pickRandom(files, 3);
      return picked.map((file) => ({
        src: `/easelLiveVol1/${folder}/${file}`,
        alt: `${folder} - ${file}`,
      }));
    });
  }, []);

  return (
    <div>
      <section className="min-h-[300px] flex flex-col justify-center px-6 bg-warm-50">
        <div className="max-w-5xl mx-auto w-full">
          <nav className="mb-3">
            <Link href="/easel-live" className="text-xs tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
              easel live
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <Link href="/easel-live/vol1" className="text-xs tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
              Vol.1
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-xs tracking-wider text-slate-500">Gallery</span>
          </nav>
          <div className="text-center">
            <p className="section-subtitle mb-4">Gallery</p>
            <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.2em] text-slate-800">
              VOL.1 Gallery
            </h1>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(image.src)}
                className="aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
          <img
            src={selectedImage}
            alt="拡大画像"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
