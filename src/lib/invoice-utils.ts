import type { InvoiceStatus } from "@/types/database";

export type InvoiceLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export function calculateInvoiceTotals(lines: InvoiceLineInput[], taxRate: number) {
  const subtotal = roundCurrency(
    lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  );
  const taxAmount = roundCurrency(subtotal * (taxRate / 100));
  const total = roundCurrency(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}

export function getInvoiceStatus(total: number, paidAmount: number): InvoiceStatus {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= total) return "paid";
  return "partially_paid";
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function nextInvoiceNumber(sequence: number, date = new Date()) {
  const year = date.getFullYear();
  return `HP-${year}-${String(sequence).padStart(5, "0")}`;
}
