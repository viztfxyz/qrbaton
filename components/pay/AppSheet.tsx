"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { Drawer } from "vaul";
import { APPS, type AppKey } from "@/lib/upi";
import { AppLogo } from "./AppLogo";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: AppKey;
  last: AppKey | null;
  onSelect: (k: AppKey) => void;
}

/** Bottom sheet for choosing which UPI app the Pay button opens. */
export function AppSheet({ open, onOpenChange, selected, last, onSelect }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[28px] bg-card pb-safe outline-none">
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" />
          <div className="px-5 pt-4 pb-2">
            <Drawer.Title className="text-xl font-semibold tracking-tight">Pay with</Drawer.Title>
            <Drawer.Description className="mt-0.5 text-sm text-mute">
              Pick the UPI app you want to approve the payment in.
            </Drawer.Description>
          </div>
          <ul className="px-3 pb-3" role="radiogroup" aria-label="UPI app">
            {APPS.map((a) => {
              const on = a.k === selected;
              return (
                <li key={a.k}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onSelect(a.k)}
                    className="relative flex w-full items-center gap-3.5 rounded-2xl px-3 py-3 text-left transition-colors active:bg-soft"
                  >
                    {on && (
                      <motion.span
                        layoutId="app-sheet-active"
                        className="absolute inset-0 rounded-2xl bg-soft"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    <AppLogo k={a.k} className="relative z-[1]" />
                    <span className="relative z-[1] flex-1">
                      <span className="block text-[15.5px] font-semibold tracking-tight">{a.name}</span>
                      {a.k === last && <span className="block text-xs font-medium text-mute">Last used</span>}
                    </span>
                    <span
                      className={`relative z-[1] grid size-6 place-items-center rounded-full border-2 transition-colors ${
                        on ? "border-ink bg-ink text-card" : "border-line"
                      }`}
                    >
                      {on && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
