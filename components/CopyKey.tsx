"use client";

import { useState } from "react";

export function CopyKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="h-11 cursor-pointer rounded-[10px] border-0 bg-black px-[18px] text-[15px] font-semibold text-white"
    >
      <span aria-live="polite">{copied ? "Copiada" : "Copiar"}</span>
    </button>
  );
}
