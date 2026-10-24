import { ogCard } from "@/lib/og";
import { SITE } from "@/lib/site";
import { amountOf, formatMoney, parseUpi } from "@/lib/upi";

/** Preview image for `/?pa=…` links. */
export function GET(req: Request) {
  const upi = parseUpi(new URL(req.url).searchParams);
  const am = upi && amountOf(upi);
  return ogCard({
    eyebrow: "Pay to",
    title: upi ? upi.pn || upi.pa : SITE.name,
    amount: am != null ? formatMoney(am, upi!.cu) : undefined,
    sub: "PhonePe · GPay · Paytm · any UPI app",
  });
}
