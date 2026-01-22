import { useMemo, useState } from "react";
import type { RatesMap } from "@/types";
import { formatDateTime } from "@/lib/utils";
import Card from "@/components/ui/Card";

type RatesCardProps = {
  baseCurrency: string;
  rates: RatesMap;
  currencyOptions: string[];
  usedCurrencies: string[];
  status: "idle" | "loading" | "success" | "error";
  lastUpdated?: number | null;
  error?: string | null;
  onRateChange: (currency: string, value: number | null) => void;
  onFetchRates: () => void;
};

export default function RatesCard({
  baseCurrency,
  rates,
  currencyOptions,
  usedCurrencies,
  status,
  lastUpdated,
  error,
  onRateChange,
  onFetchRates,
}: RatesCardProps) {
  const [query, setQuery] = useState("");
  const getUnitAmount = (currency: string) => (currency === "JPY" ? 100 : 1);

  const currencyList = useMemo(() => {
    const set = new Set<string>([baseCurrency]);
    currencyOptions.forEach((currency) => set.add(currency));
    usedCurrencies.forEach((currency) => set.add(currency));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [baseCurrency, currencyOptions, usedCurrencies]);

  const filteredList = currencyList.filter((currency) =>
    currency.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Card
      title="為替レート"
      description={`通貨ごとの単位でベース通貨換算を設定します（ベース: ${baseCurrency}）。JPYは100円単位で表示します。`}
      eyebrow="レート"
      action={
        <button
          type="button"
          onClick={onFetchRates}
          disabled={status === "loading"}
          className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "取得中" : "最新レート取得"}
        </button>
      }
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
          <p>
            {lastUpdated
              ? `最終更新: ${formatDateTime(lastUpdated)}`
              : "まだレートを取得していません"}
          </p>
          {status === "error" && error ? (
            <span className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
              {error}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="h-10 flex-1 rounded-full border border-[color:var(--line)] bg-white/90 px-4 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
            placeholder="通貨を絞り込み"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="rounded-full border border-[color:var(--line)] px-3 py-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
            {baseCurrency} 基準
          </span>
        </div>
        <div className="grid gap-3">
          {filteredList.map((currency) => {
            const unitAmount = getUnitAmount(currency);
            const rawValue = currency === baseCurrency ? 1 : rates[currency];
            const displayValue =
              typeof rawValue === "number" ? rawValue * unitAmount : "";
            return (
              <div
                key={currency}
                className="grid gap-2 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 md:grid-cols-[0.7fr_1fr] md:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {currency}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">
                    {currency === baseCurrency
                      ? `基準通貨（${unitAmount} ${currency} = ${unitAmount} ${baseCurrency}）`
                      : `${unitAmount} ${currency} =`}
                  </p>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  className="h-10 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
                  value={displayValue}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    onRateChange(
                      currency,
                      Number.isFinite(nextValue) && nextValue > 0
                        ? nextValue / unitAmount
                        : null,
                    );
                  }}
                  disabled={currency === baseCurrency}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
