import type { Expense, Participant, RatesMap } from "@/lib/types";
import SectionCard from "@/components/SectionCard";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";

type ExpensesCardProps = {
  participants: Participant[];
  expenses: Expense[];
  baseCurrency: string;
  rates: RatesMap;
  currencyOptions: string[];
  editingExpense?: Expense | null;
  onSubmitExpense: (
    payload: Omit<Expense, "id" | "createdAt">,
    expenseId?: string,
  ) => void;
  onEditExpense: (id: string) => void;
  onCancelEdit: () => void;
  onDeleteExpense: (id: string) => void;
};

export default function ExpensesCard({
  participants,
  expenses,
  baseCurrency,
  rates,
  currencyOptions,
  editingExpense,
  onSubmitExpense,
  onEditExpense,
  onCancelEdit,
  onDeleteExpense,
}: ExpensesCardProps) {
  const formKey = `${editingExpense?.id ?? "new"}-${baseCurrency}-${participants.length}`;

  return (
    <SectionCard
      title="支出"
      description="支払いを現地通貨のまま記録できます。"
      eyebrow="支出"
    >
      <div className="grid gap-6">
        <ExpenseForm
          key={formKey}
          participants={participants}
          currencyOptions={currencyOptions}
          baseCurrency={baseCurrency}
          rates={rates}
          editingExpense={editingExpense}
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
    </SectionCard>
  );
}
