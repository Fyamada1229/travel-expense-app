import { useState } from "react";
import type { Expense, Participant, RatesMap } from "@/types";
import type { CurrencyOption } from "@/lib/utils";
import Card from "@/components/ui/Card";
import ExpenseForm from "@/features/expenses/components/ExpenseForm";
import ExpenseList from "@/features/expenses/components/ExpenseList";
import ParticipantsCard from "@/features/participants/components/ParticipantsCard";

type ExpenseCardProps = {
  participants: Participant[];
  expenses: Expense[];
  paidById: Record<string, number>;
  balances: Record<string, number>;
  baseCurrency: string;
  rates: RatesMap;
  currencyOptions: CurrencyOption[];
  activeCurrencies: string[];
  favoriteCurrencies: string[];
  usedCurrencies: string[];
  editingExpense?: Expense | null;
  onAddFavoriteCurrency: (code: string) => void;
  onRemoveFavoriteCurrency: (code: string) => void;
  onSubmitExpense: (
    payload: Omit<Expense, "id" | "createdAt">,
    expenseId?: string,
  ) => void;
  onEditExpense: (id: string) => void;
  onCancelEdit: () => void;
  onDeleteExpense: (id: string) => void;
  onAddParticipant: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
  onUpdateParticipants: (participants: Participant[]) => void;
};

export default function ExpenseCard({
  participants,
  expenses,
  paidById,
  balances,
  baseCurrency,
  rates,
  currencyOptions,
  activeCurrencies,
  favoriteCurrencies,
  usedCurrencies,
  editingExpense,
  onAddFavoriteCurrency,
  onRemoveFavoriteCurrency,
  onSubmitExpense,
  onEditExpense,
  onCancelEdit,
  onDeleteExpense,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipants,
}: ExpenseCardProps) {
  const formKey = `${editingExpense?.id ?? "new"}-${baseCurrency}-${participants.length}`;
  const [isListOpen, setIsListOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const hasManyExpenses = expenses.length >= 5;
  const action = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setIsParticipantsOpen(true)}
        className="rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-[13px] font-semibold tracking-[0.14em] text-white shadow-soft transition hover:bg-[color:var(--accent-strong)] md:text-[14px]"
      >
        参加者追加
      </button>
      {hasManyExpenses ? (
        <button
          type="button"
          onClick={() => setIsListOpen(true)}
          className="rounded-full border border-[color:var(--line)] px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          追加分の表示一覧
        </button>
      ) : null}
    </div>
  );

  return (
    <Card
      title="支出"
      description="支払いを現地通貨のまま記録できます。"
      eyebrow="支出"
      action={action}
    >
      <div className="grid gap-6">
        <ExpenseForm
          key={formKey}
          participants={participants}
          currencyOptions={currencyOptions}
          activeCurrencies={activeCurrencies}
          favoriteCurrencies={favoriteCurrencies}
          usedCurrencies={usedCurrencies}
          baseCurrency={baseCurrency}
          rates={rates}
          editingExpense={editingExpense}
          onAddFavoriteCurrency={onAddFavoriteCurrency}
          onRemoveFavoriteCurrency={onRemoveFavoriteCurrency}
          onSubmit={onSubmitExpense}
          onCancelEdit={onCancelEdit}
        />
        <ExpenseList
          expenses={expenses}
          participants={participants}
          baseCurrency={baseCurrency}
          rates={rates}
          onEdit={onEditExpense}
          onDelete={onDeleteExpense}
        />
      </div>
      {isParticipantsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsParticipantsOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsParticipantsOpen(false)}
              aria-label="閉じる"
              className="absolute right-4 top-4 rounded-full border border-[color:var(--line)] bg-white/90 px-3 py-1 text-[12px] font-semibold text-[color:var(--ink)] shadow-soft transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            >
              ×
            </button>
            <ParticipantsCard
              participants={participants}
              expenses={expenses}
              paidById={paidById}
              balances={balances}
              baseCurrency={baseCurrency}
              onAddParticipant={onAddParticipant}
              onRemoveParticipant={onRemoveParticipant}
              onUpdateParticipants={onUpdateParticipants}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsParticipantsOpen(false)}
                className="rounded-full border border-[color:var(--line)] bg-white/90 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] shadow-soft transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isListOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsListOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl border border-[color:var(--line)] bg-white/95 shadow-soft backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--line)] px-6 py-5">
              <div className="space-y-1">
                <p className="text-[12px] font-semibold tracking-[0.14em] text-[color:var(--muted)]">
                  支出一覧
                </p>
                <p className="text-sm text-[color:var(--muted)]">
                  {expenses.length}件の支出が登録されています。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsListOpen(false)}
                aria-label="閉じる"
                className="rounded-full border border-[color:var(--line)] px-3 py-1 text-[12px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                ×
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <ExpenseList
                expenses={expenses}
                participants={participants}
                baseCurrency={baseCurrency}
                rates={rates}
                onEdit={onEditExpense}
                onDelete={onDeleteExpense}
              />
            </div>
            <div className="flex justify-end border-t border-[color:var(--line)] px-6 py-4">
              <button
                type="button"
                onClick={() => setIsListOpen(false)}
                className="rounded-full border border-[color:var(--line)] px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
