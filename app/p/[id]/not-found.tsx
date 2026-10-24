import { Clock3 } from "lucide-react";

export default function Expired() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-8 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-warn-soft text-warn">
        <Clock3 className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">This payment link has expired</h1>
      <p className="mt-2 text-[15px] text-mute">
        Links stay valid for 30 minutes. Start a new payment from the merchant. Don’t pay with an old link.
      </p>
    </main>
  );
}
