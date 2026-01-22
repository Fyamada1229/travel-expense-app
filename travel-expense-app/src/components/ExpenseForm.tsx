import { useMemo, useState } from "react";
import type { Expense, Participant, RatesMap } from "@/lib/types";
import { computeBaseAmount, formatCurrency } from "@/lib/finance";

type ExpenseFormProps = {
  participants: Participant[];
  currencyOptions: string[];
  baseCurrency: string;
  rates: RatesMap;
  editingExpense?: Expense | null;
  onSubmit: (
    payload: Omit<Expense, "id" | "createdAt">,
    expenseId?: string,
  ) => void;
  onCancelEdit: () => void;
};

export default function ExpenseForm({
  participants,
  currencyOptions,
  baseCurrency,
  rates,
  editingExpense,
  onSubmit,
  onCancelEdit,
}: ExpenseFormProps) {
  const [payerId, setPayerId] = useState(
    editingExpense?.payerId ?? participants[0]?.id ?? "",
  );
  const [title, setTitle] = useState(editingExpense?.title ?? "");
  const [amount, setAmount] = useState(
    editingExpense ? editingExpense.amount.toString() : "",
  );
  const [currency, setCurrency] = useState(
    editingExpense?.currency ?? baseCurrency,
  );
  const [error, setError] = useState<string | null>(null);

  const amountValue = Number(amount);
  const baseAmount = useMemo(() => {
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return null;
    }
    return computeBaseAmount(amountValue, currency, baseCurrency, rates);
  }, [amountValue, currency, baseCurrency, rates]);

  const handleSubmit = () => {
    if (participants.length === 0) {
      setError("Add a participant first.");
      return;
    }
    if (!payerId) {
      setError("Select who paid.");
      return;
    }
    if (!title.trim()) {
      setError("Expense title is required.");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (currency !== baseCurrency && (!rates[currency] || rates[currency] <= 0)) {
      setError("Add an exchange rate for this currency.");
      return;
    }

    onSubmit(
      {
        payerId,
        title: title.trim(),
        amount: amountValue,
        currency,
      },
      editingExpense?.id,
    );
    if (!editingExpense) {
      setTitle("");
      setAmount("");
      setCurrency(baseCurrency);
    }
    setError(null);
  };

  const isEditing = Boolean(editingExpense);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Who Paid
            <select
              className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              value={payerId}
              onChange={(event) => setPayerId(event.target.value)}
              disabled={participants.length === 0}
            >
              {participants.length === 0 ? (
                <option value="">Add participant</option>
              ) : null}
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Title
            <input
              className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              placeholder="Dinner, ticket, taxi"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Amount
            <input
              type="number"
              min="0"
              step="0.01"
              className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Currency
            <select
              className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              {currencyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        {baseAmount !== null ? (
          <p className="text-xs text-[color:var(--muted)]">
            Converted: {formatCurrency(baseAmount, baseCurrency)}
          </p>
        ) : null}
        {error ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--warning)]">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="h-11 rounded-xl bg-[color:var(--accent)] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--accent-strong)]"
        >
          {isEditing ? "Update Expense" : "Add Expense"}
        </button>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="h-11 rounded-xl border border-[color:var(--line)] px-6 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink)] transition hover:border-[color:var(--muted)]"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
