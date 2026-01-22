import type { CurrencyOption } from "@/lib/utils";

type HeaderProps = {
  tripTitle: string;
  baseCurrency: string;
  currencyOptions: CurrencyOption[];
  rateNotice?: string | null;
  onTitleChange: (value: string) => void;
  onBaseCurrencyChange: (value: string) => void;
  onReset: () => void;
};

export default function Header({
  tripTitle,
  baseCurrency,
  currencyOptions,
  rateNotice,
  onTitleChange,
  onBaseCurrencyChange,
  onReset,
}: HeaderProps) {
  return (
    <section className="rounded-[32px] border border-[color:var(--line)] bg-white/70 px-6 pb-6 pt-8 shadow-soft backdrop-blur">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <div className="space-y-4">
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[color:var(--muted)]">
            旅費精算プランナー
          </p>
          <div className="space-y-3">
            <h1 className="font-display text-[32px] font-semibold leading-[1.2] text-[color:var(--ink)] md:whitespace-nowrap md:text-[34px] lg:text-[36px]">
              旅をつくって、費用をスマートに割り勘。
            </h1>
            <p className="max-w-xl text-[14px] leading-7 text-[color:var(--muted)] md:text-[15px]">
              複数通貨の支払いを記録し、みんなの負担を見える化。最小回数で精算します。
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/80 p-5">
          <div className="grid gap-4">
            <label className="grid gap-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
              旅行タイトル
              <input
                className="h-11 rounded-xl border border-[color:var(--line)] bg-white/80 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
                placeholder="卒業旅行"
                value={tripTitle}
                onChange={(event) => onTitleChange(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
              ベース通貨（精算用）
              <select
                className="h-11 rounded-xl border border-[color:var(--line)] bg-white/80 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
                value={baseCurrency}
                onChange={(event) => onBaseCurrencyChange(event.target.value)}
              >
                {currencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.country} ({option.code})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[color:var(--muted)]">
        <p>この端末に自動保存されます。</p>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-[color:var(--line)] px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          旅行データをリセット
        </button>
      </div>
      {rateNotice ? (
        <p className="mt-3 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
          {rateNotice}
        </p>
      ) : null}
    </section>
  );
}
