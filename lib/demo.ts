import type { Order } from "./order";

/** Sample cart for /demo and the landing page. The payee is deliberately unpayable. */
export const DEMO_UPI = "upi://pay?pa=demo@invalid&pn=Demo%20Store&am=642.00&tn=Demo%20order&cu=INR";

export const DEMO_ORDER: Order = {
  merchant: "Blinkit",
  site: "https://blinkit.com/",
  agent: "Claude",
  note: "Restocked the weekly basics. Swapped the bread for the brown one you like, same price.",
  total: 642,
  items: [
    { name: "Amul Taaza Toned Fresh Milk", unit: "1 L", qty: 3, price: 56, mrp: 58 },
    { name: "Farm Fresh Hass Avocado", unit: "2 pcs", qty: 1, price: 149, mrp: 199 },
    { name: "Britannia 100% Whole Wheat Bread", unit: "450 g", qty: 1, price: 60 },
    { name: "Blue Tokai Attikan Estate Coffee", unit: "250 g", qty: 1, price: 245, mrp: 275 },
    { name: "Bananas Robusta", unit: "1 kg", qty: 1, price: 30, mrp: 40 },
  ],
  charges: [
    { label: "Item total", amount: 652 },
    { label: "Delivery fee", amount: 0 },
    { label: "Handling fee", amount: 4 },
    { label: "Coupon WEEKLY15", amount: -14 },
  ],
  delivery: { slot: "11 minutes", address: { label: "Home", text: "4th Cross, Indiranagar, Bengaluru" } },
  orderId: "DEMO-2048",
};
