"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Who gets told, e.g. the agent's name. */
  who: string;
  /** Sends the claim; resolves when accepted. */
  onClaim: (utr: string | undefined) => Promise<void>;
}

/** "I've paid" sheet: optional UTR, then tell the sender. */
export function ClaimSheet({ open, onOpenChange, who, onClaim }: Props) {
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const bad = utr !== "" && !/^[A-Za-z0-9]{6,35}$/.test(utr.trim());

  const submit = async () => {
    if (bad || busy) return;
    setBusy(true);
    try {
      await onClaim(utr.trim() || undefined);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn’t send that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[28px] bg-card px-5 pb-safe outline-none">
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" />
          <Drawer.Title className="pt-4 text-xl font-semibold tracking-tight">Already paid?</Drawer.Title>
          <Drawer.Description className="mt-0.5 text-sm text-mute">We’ll let {who} know so they can finish up.</Drawer.Description>
          <label className="mt-5 block">
            <span className="mb-1.5 flex justify-between px-0.5 text-[12.5px] font-semibold text-mute">
              UTR / transaction ID <span className="font-medium text-faint">Optional</span>
            </span>
            <input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="12-digit number from your UPI app"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="h-12 w-full rounded-2xl border border-line bg-soft px-4 font-mono text-[16px] outline-none transition placeholder:font-sans placeholder:text-faint focus:border-ink focus:bg-card"
            />
            {bad && <span className="mt-1.5 block px-0.5 text-[12.5px] font-medium text-bad">Letters and digits only, 6–35 characters.</span>}
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={bad || busy}
            className="mt-4 mb-3 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-save text-[16px] font-semibold text-white transition active:scale-[0.985] disabled:opacity-60 dark:text-canvas"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Yes, I’ve paid
          </button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
