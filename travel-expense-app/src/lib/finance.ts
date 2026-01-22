import type {
  Expense,
  Participant,
  RatesMap,
  SettlementTransfer,
} from "./types";

export const DEFAULT_CURRENCIES = [
  "JPY",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "KRW",
  "SGD",
  "THB",
  "TWD",
  "VND",
];

export const STORAGE_KEY = "travel-expense-session-v1";

export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getCurrencyDigits = (currency: string) => {
  try {
    const resolved = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits;
    return typeof resolved === "number" ? resolved : currency === "JPY" ? 0 : 2;
  } catch {
    return currency === "JPY" ? 0 : 2;
  }
};

export const roundTo = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const formatCurrency = (value: number, currency: string) => {
  const digits = getCurrencyDigits(currency);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${roundTo(value, digits)} ${currency}`;
  }
};

export const formatDateTime = (value: number) => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const getRateToBase = (
  currency: string,
  baseCurrency: string,
  rates: RatesMap,
) => {
  if (currency === baseCurrency) {
    return 1;
  }
  const rate = rates[currency];
  if (!rate || rate <= 0) {
    return null;
  }
  return rate;
};

export const computeBaseAmount = (
  amount: number,
  currency: string,
  baseCurrency: string,
  rates: RatesMap,
) => {
  const rate = getRateToBase(currency, baseCurrency, rates);
  if (!rate) {
    return null;
  }
  return amount * rate;
};

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
  const summary = computeSummary(
    participants,
    expenses,
    baseCurrency,
    rates,
  );
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

export const rebaseRates = (
  rates: RatesMap,
  oldBase: string,
  newBase: string,
) => {
  if (oldBase === newBase) {
    return { rates, success: true };
  }
  const oldRateForNewBase = rates[newBase];
  if (!oldRateForNewBase || oldRateForNewBase <= 0) {
    return {
      rates: {
        [newBase]: 1,
      },
      success: false,
    };
  }

  const rebased: RatesMap = {};
  Object.entries(rates).forEach(([currency, rate]) => {
    if (!rate || rate <= 0) {
      return;
    }
    if (currency === newBase) {
      rebased[currency] = 1;
      return;
    }
    rebased[currency] = roundTo(rate / oldRateForNewBase, 6);
  });

  rebased[newBase] = 1;
  return { rates: rebased, success: true };
};
