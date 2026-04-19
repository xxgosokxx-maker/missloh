"use client";

import { useEffect, useState } from "react";

type GalleryItem = { url: string; subtitle: string };

export function RandomGallery() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/gallery?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: GalleryItem[]) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) {
    return (
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-3xl bg-ink-100 shadow-soft ring-1 ring-ink-100"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((img, i) => (
        <div
          key={i}
          className="group relative aspect-square overflow-hidden rounded-3xl bg-ink-100 shadow-soft ring-1 ring-ink-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.subtitle}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
