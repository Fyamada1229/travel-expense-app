import type { Expense } from "@/types";

export const byCreatedAtDesc = (a: Expense, b: Expense) =>
  b.createdAt - a.createdAt;

export const sortExpensesByCreatedAt = (expenses: Expense[]) =>
  [...expenses].sort(byCreatedAtDesc);
