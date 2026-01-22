"use client";

import { useEffect, useMemo, useState } from "react";
import ExpensesCard from "@/components/ExpensesCard";
import ParticipantsCard from "@/components/ParticipantsCard";
import RatesCard from "@/components/RatesCard";
import SettlementCard from "@/components/SettlementCard";
import SummaryCards from "@/components/SummaryCards";
import TripHeader from "@/components/TripHeader";
import {
  DEFAULT_CURRENCIES,
  STORAGE_KEY,
  computeSettlement,
  computeSummary,
  createId,
  rebaseRates,
  roundTo,
} from "@/lib/finance";
import type { Expense, Participant, RatesMap } from "@/lib/types";

const DEFAULT_BASE_CURRENCY = "JPY";
const DEFAULT_TRIP_TITLE = "卒業旅行";

type StoredSession = {
  tripTitle?: string;
  baseCurrency?: string;
  participants?: Participant[];
  expenses?: Expense[];
  rates?: RatesMap;
  ratesUpdatedAt?: number | null;
};

export default function Home() {
  const [tripTitle, setTripTitle] = useState(DEFAULT_TRIP_TITLE);
  const [baseCurrency, setBaseCurrency] = useState(DEFAULT_BASE_CURRENCY);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rates, setRates] = useState<RatesMap>({
    [DEFAULT_BASE_CURRENCY]: 1,
  });
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<number | null>(null);
  const [rateStatus, setRateStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [rateError, setRateError] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [rateNotice, setRateNotice] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const data: StoredSession = JSON.parse(raw);
      if (data.tripTitle) {
        setTripTitle(data.tripTitle);
      }
      const storedBaseCurrency = data.baseCurrency ?? DEFAULT_BASE_CURRENCY;
      if (data.baseCurrency) {
        setBaseCurrency(data.baseCurrency);
      }
      if (Array.isArray(data.participants)) {
        setParticipants(data.participants);
      }
      if (Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      }
      if (data.rates) {
        setRates({ ...data.rates, [storedBaseCurrency]: 1 });
      }
      if (data.ratesUpdatedAt) {
        setRatesUpdatedAt(data.ratesUpdatedAt);
      }
    } catch {
      // Ignore corrupted session data.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }
    const payload: StoredSession = {
      tripTitle,
      baseCurrency,
      participants,
      expenses,
      rates,
      ratesUpdatedAt,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    tripTitle,
    baseCurrency,
    participants,
    expenses,
    rates,
    ratesUpdatedAt,
    hydrated,
  ]);

  const usedCurrencies = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((expense) => set.add(expense.currency));
    return Array.from(set);
  }, [expenses]);

  const summary = useMemo(
    () => computeSummary(participants, expenses, baseCurrency, rates),
    [participants, expenses, baseCurrency, rates],
  );

  const settlement = useMemo(
    () => computeSettlement(participants, expenses, baseCurrency, rates),
    [participants, expenses, baseCurrency, rates],
  );

  const editingExpense = useMemo(
    () => expenses.find((expense) => expense.id === editingExpenseId) ?? null,
    [expenses, editingExpenseId],
  );

  const handleReset = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "新しい旅行を開始し、現在のデータをすべて削除しますか？",
      );
      if (!confirmed) {
        return;
      }
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setTripTitle(DEFAULT_TRIP_TITLE);
    setBaseCurrency(DEFAULT_BASE_CURRENCY);
    setParticipants([]);
    setExpenses([]);
    setRates({ [DEFAULT_BASE_CURRENCY]: 1 });
    setRatesUpdatedAt(null);
    setRateStatus("idle");
    setRateError(null);
    setEditingExpenseId(null);
    setRateNotice(null);
  };

  const handleBaseCurrencyChange = (nextBase: string) => {
    if (nextBase === baseCurrency) {
      return;
    }
    const rebased = rebaseRates(rates, baseCurrency, nextBase);
    setRates(rebased.rates);
    setBaseCurrency(nextBase);
    setRateNotice(
      rebased.success
        ? null
        : "ベース通貨を変更しました。レートを再取得するか手動で設定してください。",
    );
  };

  const handleAddParticipant = (name: string) => {
    setParticipants((prev) => [...prev, { id: createId(), name }]);
  };

  const handleRemoveParticipant = (id: string) => {
    if (expenses.some((expense) => expense.payerId === id)) {
      return;
    }
    setParticipants((prev) => prev.filter((participant) => participant.id !== id));
  };

  const handleSubmitExpense = (
    payload: Omit<Expense, "id" | "createdAt">,
    expenseId?: string,
  ) => {
    if (expenseId) {
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === expenseId ? { ...expense, ...payload } : expense,
        ),
      );
      setEditingExpenseId(null);
      return;
    }
    const createdAt = Date.now();
    setExpenses((prev) => [
      ...prev,
      { id: createId(), createdAt, ...payload },
    ]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    if (editingExpenseId === id) {
      setEditingExpenseId(null);
    }
  };

  const handleRateChange = (currency: string, value: number | null) => {
    setRates((prev) => {
      const next = { ...prev, [baseCurrency]: 1 };
      if (currency === baseCurrency) {
        return next;
      }
      if (value === null) {
        delete next[currency];
      } else {
        next[currency] = value;
      }
      return next;
    });
    setRateNotice(null);
  };

  const handleFetchRates = async () => {
    setRateStatus("loading");
    setRateError(null);
    try {
      const response = await fetch(
        `/api/exchange?base=${encodeURIComponent(baseCurrency)}`,
      );
      if (!response.ok) {
        throw new Error("レートの取得に失敗しました。");
      }
      const data = (await response.json()) as {
        success?: boolean;
        base?: string;
        date?: string;
        rates?: Record<string, number>;
      };
      if (data.success === false) {
        throw new Error("レートを取得できませんでした。");
      }
      if (!data.rates) {
        throw new Error("レートを取得できませんでした。");
      }
      const nextRates: RatesMap = { [baseCurrency]: 1 };
      Object.entries(data.rates).forEach(([currency, rate]) => {
        if (currency === baseCurrency || typeof rate !== "number" || rate <= 0) {
          return;
        }
        nextRates[currency] = roundTo(1 / rate, 6);
      });
      setRates(nextRates);
      setRatesUpdatedAt(Date.now());
      setRateStatus("success");
      setRateNotice(null);
    } catch (error) {
      setRateStatus("error");
      setRateError(
        error instanceof Error ? error.message : "レートを取得できませんでした。",
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-(--accent)/20 blur-[90px]" />
        <div className="absolute right-10 top-28 h-72 w-72 rounded-full bg-(--mint)/25 blur-[110px]" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-(--sand)/60 blur-[120px]" />
      </div>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-20 pt-12 md:px-8">
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <TripHeader
            tripTitle={tripTitle}
            baseCurrency={baseCurrency}
            currencyOptions={DEFAULT_CURRENCIES}
            rateNotice={rateNotice}
            onTitleChange={setTripTitle}
            onBaseCurrencyChange={handleBaseCurrencyChange}
            onReset={handleReset}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <SummaryCards
            total={summary.total}
            average={summary.average}
            participantsCount={participants.length}
            expenseCount={expenses.length}
            baseCurrency={baseCurrency}
            missingRates={summary.missingRates}
          />
        </div>

        <div
          className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] animate-fade-up"
          style={{ animationDelay: "180ms" }}
        >
          <ParticipantsCard
            participants={participants}
            expenses={expenses}
            paidById={summary.paidById}
            balances={settlement.balances}
            baseCurrency={baseCurrency}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
          />
          <RatesCard
            baseCurrency={baseCurrency}
            rates={rates}
            currencyOptions={DEFAULT_CURRENCIES}
            usedCurrencies={usedCurrencies}
            status={rateStatus}
            lastUpdated={ratesUpdatedAt}
            error={rateError}
            onRateChange={handleRateChange}
            onFetchRates={handleFetchRates}
          />
        </div>

        <div
          className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <ExpensesCard
            participants={participants}
            expenses={expenses}
            baseCurrency={baseCurrency}
            rates={rates}
            currencyOptions={DEFAULT_CURRENCIES}
            editingExpense={editingExpense}
            onSubmitExpense={handleSubmitExpense}
            onEditExpense={setEditingExpenseId}
            onCancelEdit={() => setEditingExpenseId(null)}
            onDeleteExpense={handleDeleteExpense}
          />
          <SettlementCard
            transfers={settlement.transfers}
            participants={participants}
            balances={settlement.balances}
            baseCurrency={baseCurrency}
            missingRates={settlement.missingRates}
          />
        </div>
      </main>
    </div>
  );
}
