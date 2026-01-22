import { useMemo, useState } from "react";
import type { Expense, Participant } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";
import SectionCard from "@/components/SectionCard";

type ParticipantsCardProps = {
  participants: Participant[];
  expenses: Expense[];
  paidById: Record<string, number>;
  balances: Record<string, number>;
  baseCurrency: string;
  onAddParticipant: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
};

export default function ParticipantsCard({
  participants,
  expenses,
  paidById,
  balances,
  baseCurrency,
  onAddParticipant,
  onRemoveParticipant,
}: ParticipantsCardProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const expenseByPayer = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((expense) => {
      map[expense.payerId] = (map[expense.payerId] ?? 0) + 1;
    });
    return map;
  }, [expenses]);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("名前を入力してください。");
      return;
    }
    if (participants.some((participant) => participant.name === trimmed)) {
      setError("同じ名前が既にあります。");
      return;
    }
    onAddParticipant(trimmed);
    setName("");
    setError(null);
  };

  return (
    <SectionCard
      title="参加者"
      description="旅行メンバーを追加して支払い状況を見える化。"
      eyebrow="参加者"
    >
      <div className="grid gap-5">
        <div className="grid gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
          <label className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
            参加者を追加
          </label>
          <div className="flex flex-wrap gap-3">
            <input
              className="h-11 flex-1 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              placeholder="名前を入力"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="h-11 rounded-xl bg-[color:var(--accent)] px-5 text-[11px] font-semibold tracking-[0.12em] text-white transition hover:bg-[color:var(--accent-strong)]"
            >
              追加
            </button>
          </div>
          {error ? (
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
              {error}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3">
          {participants.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">
              精算を始めるには参加者を追加してください。
            </p>
          ) : null}
          {participants.map((participant) => {
            const hasExpenses = Boolean(expenseByPayer[participant.id]);
            const balance = balances[participant.id] ?? 0;
            const paid = paidById[participant.id] ?? 0;
            return (
              <div
                key={participant.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {participant.name}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">
                    支払い合計 {formatCurrency(paid, baseCurrency)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.1em] ${
                      balance >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {balance >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(balance), baseCurrency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(participant.id)}
                    disabled={hasExpenses}
                    className="rounded-full border border-[color:var(--line)] px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-[color:var(--ink)] transition hover:border-[color:var(--warning)] hover:text-[color:var(--warning)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })}
          {participants.some((participant) => expenseByPayer[participant.id]) ? (
            <p className="text-xs text-[color:var(--muted)]">
              支出がある参加者は削除できません。
            </p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
