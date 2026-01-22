type TripHeaderProps = {
  tripTitle: string;
  baseCurrency: string;
  currencyOptions: string[];
  rateNotice?: string | null;
  onTitleChange: (value: string) => void;
  onBaseCurrencyChange: (value: string) => void;
  onReset: () => void;
};

export default function TripHeader({
  tripTitle,
  baseCurrency,
  currencyOptions,
  rateNotice,
  onTitleChange,
  onBaseCurrencyChange,
  onReset,
}: TripHeaderProps) {
  return (
    <section className="rounded-[32px] border border-[color:var(--line)] bg-white/70 px-6 pb-6 pt-8 shadow-soft backdrop-blur">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Travel Expense Planner
          </p>
          <div className="space-y-3">
            <h1 className="font-display text-4xl leading-tight text-[color:var(--ink)] md:text-5xl">
              Craft the trip, split the cost.
            </h1>
            <p className="max-w-xl text-sm text-[color:var(--muted)] md:text-base">
              Track payments in multiple currencies, keep everyone aligned, and
              settle with the fewest transfers.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/80 p-5">
          <div className="grid gap-4">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Trip Title
              <input
                className="h-11 rounded-xl border border-[color:var(--line)] bg-white/80 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
                placeholder="Graduation Trip"
                value={tripTitle}
                onChange={(event) => onTitleChange(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Base Currency
              <select
                className="h-11 rounded-xl border border-[color:var(--line)] bg-white/80 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
                value={baseCurrency}
                onChange={(event) => onBaseCurrencyChange(event.target.value)}
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[color:var(--muted)]">
        <p>Session auto-saves locally on this device.</p>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-[color:var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          Reset Trip
        </button>
      </div>
      {rateNotice ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--warning)]">
          {rateNotice}
        </p>
      ) : null}
    </section>
  );
}
