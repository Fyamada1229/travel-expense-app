import { useEffect, useMemo, useState } from "react";
import type { CurrencyRate } from "@/types";
import { formatDateTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import useMediaQuery from "@/hooks/useMediaQuery";
import {
  TOP_CURRENCY_DESKTOP_COUNT,
  TOP_CURRENCY_MOBILE_COUNT,
} from "@/features/rates/constants";

type RatesCardProps = {
  baseCurrency: string;
  currencyRates: CurrencyRate[];
  status: "idle" | "loading" | "success" | "error";
  lastUpdated?: number | null;
  error?: string | null;
  onRateChange: (
    code: string,
    updates: Partial<Pick<CurrencyRate, "unit" | "rateToJPY">>,
  ) => void;
  onFetchRates: () => void;
};

type DraftRate = {
  unit: string;
  rateToJPY: string;
};

const buildDrafts = (rates: CurrencyRate[]) => {
  return rates.reduce<Record<string, DraftRate>>((acc, rate) => {
    acc[rate.code] = {
      unit: rate.unit > 0 ? String(rate.unit) : "",
      rateToJPY: rate.rateToJPY > 0 ? String(rate.rateToJPY) : "",
    };
    return acc;
  }, {});
};

const getNumberError = (value: string) => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "1以上で入力してください";
  }
  return null;
};

export default function RatesCard({
  baseCurrency,
  currencyRates,
  status,
  lastUpdated,
  error,
  onRateChange,
  onFetchRates,
}: RatesCardProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drafts, setDrafts] = useState(() => buildDrafts(currencyRates));

  useEffect(() => {
    setDrafts(buildDrafts(currencyRates));
  }, [currencyRates]);

  const visibleRates = useMemo(() => {
    const count = isDesktop
      ? TOP_CURRENCY_DESKTOP_COUNT
      : TOP_CURRENCY_MOBILE_COUNT;
    return currencyRates.slice(0, count);
  }, [currencyRates, isDesktop]);

  const renderRow = (rate: CurrencyRate) => {
    const draft = drafts[rate.code] ?? { unit: "", rateToJPY: "" };
    const unitError = getNumberError(draft.unit);
    const rateError = getNumberError(draft.rateToJPY);

    return (
      <div
        key={rate.code}
        className="grid gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 md:grid-cols-[1.1fr_0.7fr_0.9fr] md:items-center"
      >
        <div>
          <p className="text-sm font-semibold text-[color:var(--ink)]">
            {rate.country ? `${rate.country} (${rate.code})` : rate.code}
          </p>
        </div>
        <label className="grid gap-1 text-[10px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
          単位
          <input
            type="number"
            min="0.0001"
            step="0.0001"
            inputMode="decimal"
            className={`h-10 rounded-xl border bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)] ${
              unitError ? "border-rose-300" : "border-[color:var(--line)]"
            }`}
            value={draft.unit}
            onChange={(event) => {
              const nextValue = event.target.value;
              setDrafts((prev) => ({
                ...prev,
                [rate.code]: { ...prev[rate.code], unit: nextValue },
              }));
              const parsed = Number(nextValue);
              if (Number.isFinite(parsed) && parsed > 0) {
                onRateChange(rate.code, { unit: parsed });
              }
            }}
          />
          {unitError ? (
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
              {unitError}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1 text-[10px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
          レート（JPY）
          <input
            type="number"
            min="0.0001"
            step="0.0001"
            inputMode="decimal"
            className={`h-10 rounded-xl border bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)] ${
              rateError ? "border-rose-300" : "border-[color:var(--line)]"
            }`}
            value={draft.rateToJPY}
            onChange={(event) => {
              const nextValue = event.target.value;
              setDrafts((prev) => ({
                ...prev,
                [rate.code]: { ...prev[rate.code], rateToJPY: nextValue },
              }));
              const parsed = Number(nextValue);
              if (Number.isFinite(parsed) && parsed > 0) {
                onRateChange(rate.code, { rateToJPY: parsed });
              }
            }}
          />
          {rateError ? (
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
              {rateError}
            </span>
          ) : null}
        </label>
      </div>
    );
  };

  return (
    <Card
      title="為替レート"
      description={`通貨ごとの単位とJPY換算レートを入力します（精算ベース: ${baseCurrency}）。`}
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
              : "まだレートを入力していません"}
          </p>
          {status === "error" && error ? (
            <span className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
              {error}
            </span>
          ) : null}
          {!isDesktop ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            >
              為替一覧を見る
            </button>
          ) : null}
        </div>

        <div className="grid gap-3">{visibleRates.map(renderRow)}</div>

        {!isDesktop && isModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setIsModalOpen(false);
              }
            }}
          >
            <div className="w-full max-w-2xl rounded-3xl border border-[color:var(--line)] bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-[color:var(--muted)]">
                    TOP10 CURRENCIES
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[color:var(--ink)]">
                    為替一覧
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[color:var(--line)] text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid gap-3">
                  {currencyRates.map(renderRow)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="mt-4 h-11 w-full rounded-xl border border-[color:var(--line)] bg-white text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                閉じる
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
