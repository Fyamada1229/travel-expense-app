import { formatCurrency } from "@/lib/finance";

type SummaryCardsProps = {
  total: number;
  average: number;
  participantsCount: number;
  expenseCount: number;
  baseCurrency: string;
  missingRates: number;
};

const SummaryCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) => (
  <div className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-5 shadow-soft">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
      {label}
    </p>
    <p className="mt-3 font-display text-2xl text-[color:var(--ink)]">
      {value}
    </p>
    {helper ? (
      <p className="mt-2 text-xs text-[color:var(--muted)]">{helper}</p>
    ) : null}
  </div>
);

export default function SummaryCards({
  total,
  average,
  participantsCount,
  expenseCount,
  baseCurrency,
  missingRates,
}: SummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Total Spend"
        value={formatCurrency(total, baseCurrency)}
        helper={missingRates ? "Conversion missing for some expenses" : undefined}
      />
      <SummaryCard
        label="Average Per Person"
        value={formatCurrency(average, baseCurrency)}
        helper={participantsCount ? undefined : "Add participants to calculate"}
      />
      <SummaryCard
        label="Participants"
        value={`${participantsCount}`}
        helper={participantsCount ? "Active travelers" : "No travelers yet"}
      />
      <SummaryCard
        label="Expenses Logged"
        value={`${expenseCount}`}
        helper={expenseCount ? "Most recent at top" : "Start recording spend"}
      />
    </section>
  );
}
