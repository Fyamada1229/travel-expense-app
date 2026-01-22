import type { Expense, Participant, RatesMap } from "@/lib/types";
import {
  computeBaseAmount,
  formatCurrency,
  formatDateTime,
} from "@/lib/finance";

const byCreatedAt = (a: Expense, b: Expense) => b.createdAt - a.createdAt;

type ExpenseListProps = {
  expenses: Expense[];
  participants: Participant[];
  baseCurrency: string;
  rates: RatesMap;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function ExpenseList({
  expenses,
  participants,
  baseCurrency,
  rates,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  const participantMap = new Map(
    participants.map((participant) => [participant.id, participant.name]),
  );

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted)]">
        まだ支出がありません。上のフォームから追加しましょう。
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {[...expenses].sort(byCreatedAt).map((expense) => {
        const baseAmount = computeBaseAmount(
          expense.amount,
          expense.currency,
          baseCurrency,
          rates,
        );
        return (
          <div
            key={expense.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                {expense.title}
              </p>
              <p className="text-xs text-[color:var(--muted)]">
                {participantMap.get(expense.payerId) ?? "不明"} -{" "}
                {formatDateTime(expense.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
                {baseAmount !== null ? (
                  <p className="text-xs text-[color:var(--muted)]">
                    {formatCurrency(baseAmount, baseCurrency)}
                  </p>
                ) : (
                  <p className="text-xs text-[color:var(--warning)]">
                    レート未設定
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(expense.id)}
                  className="rounded-full border border-[color:var(--line)] px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(expense.id)}
                  className="rounded-full border border-[color:var(--line)] px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-[color:var(--warning)] transition hover:border-[color:var(--warning)]"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
