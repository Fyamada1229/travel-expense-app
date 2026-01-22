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
    <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
      {label}
    </p>
    <p className="mt-3 font-display text-[22px] font-semibold text-[color:var(--ink)]">
      {value}
    </p>
    {helper ? (
      <p className="mt-2 text-[12px] text-[color:var(--muted)]">{helper}</p>
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
        label="総支出"
        value={formatCurrency(total, baseCurrency)}
        helper={missingRates ? "一部の支出に換算レートがありません" : undefined}
      />
      <SummaryCard
        label="1人あたり平均"
        value={formatCurrency(average, baseCurrency)}
        helper={participantsCount ? undefined : "参加者を追加すると計算できます"}
      />
      <SummaryCard
        label="参加者"
        value={`${participantsCount}`}
        helper={participantsCount ? "参加中の人数" : "まだ参加者がいません"}
      />
      <SummaryCard
        label="記録した支出"
        value={`${expenseCount}`}
        helper={expenseCount ? "最新の支出が上に表示" : "支出を記録しましょう"}
      />
    </section>
  );
}
