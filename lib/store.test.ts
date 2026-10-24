import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { newId, validId } = await import("./store");

describe("session ids", () => {
  it("are always 14 valid characters", () => {
    for (let i = 0; i < 5000; i++) {
      const id = newId();
      expect(id).toHaveLength(14);
      expect(validId(id)).toBe(true);
    }
  });
  it("reject lookalikes and wrong lengths", () => {
    expect(validId("abcdefghijkmnl")).toBe(false); // contains l
    expect(validId("abc")).toBe(false);
  });
});
