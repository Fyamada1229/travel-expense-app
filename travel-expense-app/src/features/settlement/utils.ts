import type { Expense, Participant, RatesMap, SettlementTransfer } from "@/types";
import { computeBaseAmount, getCurrencyDigits, roundTo } from "@/lib/utils";

export type Summary = {
  total: number;
  average: number;
  paidById: Record<string, number>;
  missingRates: number;
};

export const computeSummary = (
  participants: Participant[],
  expenses: Expense[],
  baseCurrency: string,
  rates: RatesMap,
): Summary => {
  const digits = getCurrencyDigits(baseCurrency);
  const paidById: Record<string, number> = {};
  participants.forEach((participant) => {
    paidById[participant.id] = 0;
  });

  let total = 0;
  let missingRates = 0;

  expenses.forEach((expense) => {
    const baseAmount = computeBaseAmount(
      expense.amount,
      expense.currency,
      baseCurrency,
      rates,
    );
    if (baseAmount === null) {
      missingRates += 1;
      return;
    }
    const rounded = roundTo(baseAmount, digits);
    total = roundTo(total + rounded, digits);
    paidById[expense.payerId] = roundTo(
      (paidById[expense.payerId] ?? 0) + rounded,
      digits,
    );
  });

  const average = participants.length
    ? roundTo(total / participants.length, digits)
    : 0;

  return {
    total,
    average,
    paidById,
    missingRates,
  };
};

export type Settlement = {
  transfers: SettlementTransfer[];
  balances: Record<string, number>;
  missingRates: number;
};

export const computeSettlement = (
  participants: Participant[],
  expenses: Expense[],
  baseCurrency: string,
  rates: RatesMap,
): Settlement => {
  const summary = computeSummary(participants, expenses, baseCurrency, rates);
  const digits = getCurrencyDigits(baseCurrency);
  const balances: Record<string, number> = {};

  participants.forEach((participant) => {
    const paid = summary.paidById[participant.id] ?? 0;
    balances[participant.id] = roundTo(paid - summary.average, digits);
  });

  const minAmount = 10 ** -digits / 2;
  const creditors = participants
    .map((participant) => ({
      id: participant.id,
      amount: balances[participant.id],
    }))
    .filter((entry) => entry.amount > minAmount)
    .map((entry) => ({ ...entry }));

  const debtors = participants
    .map((participant) => ({
      id: participant.id,
      amount: -balances[participant.id],
    }))
    .filter((entry) => entry.amount > minAmount)
    .map((entry) => ({ ...entry }));

  const transfers: SettlementTransfer[] = [];
  let debtIndex = 0;
  let creditIndex = 0;

  while (debtIndex < debtors.length && creditIndex < creditors.length) {
    const debtor = debtors[debtIndex];
    const creditor = creditors[creditIndex];
    const amount = Math.min(debtor.amount, creditor.amount);
    if (amount > minAmount) {
      transfers.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: roundTo(amount, digits),
      });
    }

    debtor.amount = roundTo(debtor.amount - amount, digits);
    creditor.amount = roundTo(creditor.amount - amount, digits);

    if (debtor.amount <= minAmount) {
      debtIndex += 1;
    }
    if (creditor.amount <= minAmount) {
      creditIndex += 1;
    }
  }

  return {
    transfers,
    balances,
    missingRates: summary.missingRates,
  };
};
