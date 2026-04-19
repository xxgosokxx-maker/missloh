"use client";

import type { MouseEvent, ReactNode } from "react";

export function ClickBarrier({ children }: { children: ReactNode }) {
  return (
    <span
      onClick={(e: MouseEvent) => e.stopPropagation()}
      className="inline-flex items-center gap-2"
    >
      {children}
    </span>
  );
}
