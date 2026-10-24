import type { Order } from "@/lib/order";
import type { Upi } from "@/lib/upi";
import type { LiveSession } from "@/lib/useSessionStatus";
import { PayScreen } from "./pay/PayScreen";

export function PayView(props: { upi: Upi; order?: Order | null; session?: LiveSession; demo?: boolean }) {
  return <PayScreen {...props} />;
}
