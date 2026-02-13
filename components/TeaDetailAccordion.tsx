"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function TeaDetailAccordion({ title, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

  useEffect(() => {
    if (!bodyRef.current) return;
    if (open) {
      setHeight(bodyRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !bodyRef.current) return;
    const ro = new ResizeObserver(() => {
      if (bodyRef.current) setHeight(bodyRef.current.scrollHeight);
    });
    ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, [open]);

  return (
    <div className="border-b border-black/15">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-medium tracking-[0.02em] text-black">{title}</span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/20 text-[18px] text-black transition-transform"
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        className="overflow-hidden transition-[height] duration-300 ease-out"
        style={{ height: height !== undefined ? (open ? height : 0) : undefined }}
      >
        <div ref={bodyRef} className="pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
