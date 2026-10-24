"use client";

import { useEffect, useState } from "react";
import type { Status } from "./order";

const POLL_MS = 2500;
/** Session id of the /demo page, which has nothing to poll. */
export const DEMO_ID = "demo";

export interface LiveSession {
  id: string;
  status: Status;
  expiresAt: number;
}

/**
 * Poll the session's status while it's pending and the tab is visible. Returns [status, now, set]; `set`
 * applies a status the page already knows (e.g. after "I've paid", or in the demo).
 */
export function useSessionStatus(session?: LiveSession): [Status | null, number, (s: Status) => void] {
  const [status, setStatus] = useState<Status | null>(session?.status ?? null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!session || session.id === DEMO_ID || status !== "pending") return;
    let stop = false;
    const poll = async () => {
      if (Date.now() >= session.expiresAt) return setStatus("expired");
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/sessions/${session.id}`, { cache: "no-store" });
        const body = (await r.json()) as { status?: Status };
        if (!stop && body.status && body.status !== "pending") setStatus(body.status);
      } catch {}
    };
    const h = window.setInterval(poll, POLL_MS);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      stop = true;
      clearInterval(h);
      clearInterval(clock);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [session, status]);

  return [status, now, setStatus];
}
