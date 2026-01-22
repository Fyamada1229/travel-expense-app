import { formatCurrency } from "@/lib/utils";

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
  <div className="min-w-0 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-5 shadow-soft md:min-h-[140px] md:px-5 md:py-6 lg:px-6 lg:py-7">
    <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)] md:text-[12px] lg:text-[13px]">
      {label}
    </p>
    <p className="mt-3 min-w-0 break-words font-display text-[18px] font-semibold leading-tight text-[color:var(--ink)] md:text-[22px] lg:text-[24px]">
      {value}
    </p>
    {helper ? (
      <p className="mt-2 text-[12px] text-[color:var(--muted)] md:text-[13px] lg:text-[14px]">
        {helper}
      </p>
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
    <section className="grid content-start gap-4 md:grid-cols-2 md:gap-5 xl:gap-6 2xl:grid-cols-4">
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
