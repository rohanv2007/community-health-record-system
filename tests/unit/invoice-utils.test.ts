import {
  calculateInvoiceTotals,
  getInvoiceStatus,
  nextInvoiceNumber,
  roundCurrency,
} from "@/lib/invoice-utils";

describe("invoice utilities", () => {
  it("calculates subtotal, tax, and total", () => {
    expect(
      calculateInvoiceTotals(
        [
          { description: "Consultation", quantity: 1, unitPrice: 500 },
          { description: "Lab test", quantity: 2, unitPrice: 150 },
        ],
        5
      )
    ).toEqual({ subtotal: 800, taxAmount: 40, total: 840 });
  });

  it("rounds currency values safely", () => {
    expect(roundCurrency(1.005)).toBe(1.01);
    expect(roundCurrency(20.456)).toBe(20.46);
  });

  it("derives payment status", () => {
    expect(getInvoiceStatus(1000, 0)).toBe("unpaid");
    expect(getInvoiceStatus(1000, 400)).toBe("partially_paid");
    expect(getInvoiceStatus(1000, 1000)).toBe("paid");
    expect(getInvoiceStatus(1000, 1200)).toBe("paid");
  });

  it("generates invoice numbers for the current year", () => {
    expect(nextInvoiceNumber(12, new Date("2026-05-11"))).toBe("HP-2026-00012");
  });
});
