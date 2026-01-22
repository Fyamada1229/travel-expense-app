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
      setError("先に参加者を追加してください。");
      return;
    }
    if (!payerId) {
      setError("支払った人を選択してください。");
      return;
    }
    if (!title.trim()) {
      setError("支出のタイトルを入力してください。");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("金額は0より大きい値を入力してください。");
      return;
    }
    if (currency !== baseCurrency && (!rates[currency] || rates[currency] <= 0)) {
      setError("この通貨の為替レートを設定してください。");
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
          <label className="grid gap-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
            支払った人
            <select
              className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              value={payerId}
              onChange={(event) => setPayerId(event.target.value)}
              disabled={participants.length === 0}
            >
              {participants.length === 0 ? (
                <option value="">参加者を追加</option>
              ) : null}
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
            内容
            <input
              className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              placeholder="食事、チケット、タクシー"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <label className="grid gap-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
            金額
            <input
              type="number"
              min="0"
              step="0.01"
              className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              placeholder="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
            通貨
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
          <p className="text-[12px] text-[color:var(--muted)]">
            換算後: {formatCurrency(baseAmount, baseCurrency)}
          </p>
        ) : null}
        {error ? (
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="h-11 rounded-xl bg-[color:var(--accent)] px-6 text-[11px] font-semibold tracking-[0.12em] text-white transition hover:bg-[color:var(--accent-strong)]"
        >
          {isEditing ? "更新" : "追加"}
        </button>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="h-11 rounded-xl border border-[color:var(--line)] px-6 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] transition hover:border-[color:var(--muted)]"
          >
            キャンセル
          </button>
        ) : null}
      </div>
    </div>
  );
}
