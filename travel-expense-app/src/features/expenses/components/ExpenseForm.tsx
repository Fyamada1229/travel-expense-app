import { useMemo, useState } from "react";
import type { Expense, Participant, RatesMap } from "@/types";
import {
  computeBaseAmount,
  formatCurrency,
  getCurrencyLabel,
  type CurrencyOption,
} from "@/lib/utils";

type ExpenseFormProps = {
  participants: Participant[];
  currencyOptions: CurrencyOption[];
  activeCurrencies: string[];
  favoriteCurrencies: string[];
  usedCurrencies: string[];
  baseCurrency: string;
  rates: RatesMap;
  editingExpense?: Expense | null;
  onAddFavoriteCurrency: (code: string) => void;
  onRemoveFavoriteCurrency: (code: string) => void;
  onSubmit: (
    payload: Omit<Expense, "id" | "createdAt">,
    expenseId?: string,
  ) => void;
  onCancelEdit: () => void;
};

export default function ExpenseForm({
  participants,
  currencyOptions,
  activeCurrencies,
  favoriteCurrencies,
  usedCurrencies,
  baseCurrency,
  rates,
  editingExpense,
  onAddFavoriteCurrency,
  onRemoveFavoriteCurrency,
  onSubmit,
  onCancelEdit,
}: ExpenseFormProps) {
  const [payerId, setPayerId] = useState(
    editingExpense?.payerId ?? participants[0]?.id ?? "",
  );
  const [title, setTitle] = useState(editingExpense?.title ?? "");
  const [amount, setAmount] = useState(
    editingExpense ? editingExpense.amount.toString() : "",
  );
  const [currency, setCurrency] = useState(
    editingExpense?.currency ?? baseCurrency,
  );
  const [error, setError] = useState<string | null>(null);
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const [currencyAddError, setCurrencyAddError] = useState<string | null>(null);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const pendingLabel = pendingCurrency ? getCurrencyLabel(pendingCurrency) : null;

  const filteredCurrencyOptions = useMemo(() => {
    const query = currencyQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return currencyOptions.filter((option) => {
      const haystack = [
        option.code,
        option.country,
        option.name,
        ...option.search,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [currencyOptions, currencyQuery]);

  const resolveCurrencyToAdd = () => {
    if (pendingCurrency) {
      return pendingCurrency;
    }
    const query = currencyQuery.trim().toUpperCase();
    if (!query) {
      return null;
    }
    const byCode = currencyOptions.find((option) => option.code === query);
    if (byCode) {
      return byCode.code;
    }
    if (filteredCurrencyOptions.length === 1) {
      return filteredCurrencyOptions[0].code;
    }
    return null;
  };

  const amountValue = Number(amount);
  const baseAmount = useMemo(() => {
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return null;
    }
    return computeBaseAmount(amountValue, currency, baseCurrency, rates);
  }, [amountValue, currency, baseCurrency, rates]);

  const handleSubmit = () => {
    if (participants.length === 0) {
      setError("先に参加者を追加してください。");
      return;
    }
    if (!payerId) {
      setError("支払った人を選択してください。");
      return;
    }
    if (!title.trim()) {
      setError("支出のタイトルを入力してください。");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("金額は0より大きい値を入力してください。");
      return;
    }
    if (currency !== baseCurrency && (!rates[currency] || rates[currency] <= 0)) {
      setError("この通貨の為替レートを設定してください。");
      return;
    }

    onAddFavoriteCurrency(currency);
    onSubmit(
      {
        payerId,
        title: title.trim(),
        amount: amountValue,
        currency,
      },
      editingExpense?.id,
    );
    if (!editingExpense) {
      setTitle("");
      setAmount("");
      setCurrency(baseCurrency);
      setCurrencyQuery("");
      setPendingCurrency(null);
      setCurrencyAddError(null);
      setIsCurrencyOpen(false);
    }
    setError(null);
  };

  const isEditing = Boolean(editingExpense);
  const baseLabel = getCurrencyLabel(baseCurrency);
  const addCandidate = resolveCurrencyToAdd();

  const handleAddCurrency = () => {
    const nextCurrency = resolveCurrencyToAdd();
    if (!nextCurrency) {
      setCurrencyAddError("通貨を選択してください。");
      return;
    }
    onAddFavoriteCurrency(nextCurrency);
    setCurrency(nextCurrency);
    setCurrencyQuery("");
    setPendingCurrency(null);
    setCurrencyAddError(null);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-2xl border border-[color:var(--line)] bg-white/80 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
            支払った人
            <select
              className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              value={payerId}
              onChange={(event) => setPayerId(event.target.value)}
              disabled={participants.length === 0}
            >
              {participants.length === 0 ? (
                <option value="">参加者を追加</option>
              ) : null}
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
            内容
            <input
              className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
              placeholder="食事、チケット、タクシー"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
              金額（現地通貨）
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="number"
                min="0"
                step="0.01"
                className="h-11 w-full rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-sm font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)] sm:flex-1"
                placeholder="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setIsCurrencyOpen((prev) => !prev)}
                className="h-11 rounded-xl border border-[color:var(--line)] bg-white/90 px-4 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] shadow-inner transition hover:border-[color:var(--accent)] sm:min-w-[180px]"
              >
                {getCurrencyLabel(currency)}
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
              使用中の通貨
            </p>
            <div className="flex flex-wrap gap-2">
              {activeCurrencies.map((code) => {
                const isSelected = code === currency;
                const isBase = code === baseCurrency;
                const isUsed = usedCurrencies.includes(code);
                const isFavorite = favoriteCurrencies.includes(code);
                const canRemove = isFavorite && !isBase && !isUsed;
                return (
                  <div
                    key={code}
                    className={`flex items-center gap-1 rounded-full border px-2 py-1 transition ${
                      isSelected
                        ? "border-[color:var(--accent)] bg-white text-[color:var(--accent-strong)]"
                        : "border-[color:var(--line)] bg-white/80 text-[color:var(--ink)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setCurrency(code)}
                      className="px-2 text-[11px] font-semibold tracking-[0.1em]"
                    >
                      {getCurrencyLabel(code)}
                      {isBase ? "・基準" : ""}
                    </button>
                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => {
                          onRemoveFavoriteCurrency(code);
                          if (currency === code) {
                            setCurrency(baseCurrency);
                          }
                        }}
                        className="rounded-full p-1 text-[color:var(--muted)] transition hover:text-rose-600"
                        aria-label={`${code}を削除`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {activeCurrencies.length === 0 ? (
                <span className="text-[12px] text-[color:var(--muted)]">
                  通貨を追加してください。
                </span>
              ) : null}
            </div>
            <p className="text-[12px] text-[color:var(--muted)]">
              選択中: {getCurrencyLabel(currency)} / ベース: {baseLabel}
            </p>
          </div>
          {isCurrencyOpen ? (
            <div className="grid gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--sand)]/40 p-3">
              <div className="grid gap-2">
                <label className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
                  通貨を追加
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="h-10 flex-1 rounded-xl border border-[color:var(--line)] bg-white/90 px-3 text-[13px] font-semibold text-[color:var(--ink)] shadow-inner outline-none transition focus:border-[color:var(--accent)]"
                    placeholder="国名または通貨コードで検索"
                    value={currencyQuery}
                    onChange={(event) => {
                      setCurrencyQuery(event.target.value);
                      setPendingCurrency(null);
                      setCurrencyAddError(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCurrency}
                    disabled={!addCandidate}
                    className="h-10 rounded-xl bg-[color:var(--accent)] px-4 text-[11px] font-semibold tracking-[0.12em] text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    追加
                  </button>
                </div>
                {currencyQuery ? (
                  pendingCurrency ? (
                    <p className="text-[12px] text-[color:var(--muted)]">
                      追加候補: {pendingLabel}
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {filteredCurrencyOptions.slice(0, 6).map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => {
                            setPendingCurrency(option.code);
                            setCurrencyQuery(
                              `${option.country} (${option.code})`,
                            );
                            setCurrencyAddError(null);
                          }}
                          className="flex items-center justify-between rounded-xl border border-[color:var(--line)] bg-white/90 px-3 py-2 text-[12px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)]"
                        >
                          <span>{option.country}</span>
                          <span className="text-[11px] text-[color:var(--muted)]">
                            {option.code}
                          </span>
                        </button>
                      ))}
                      {filteredCurrencyOptions.length === 0 ? (
                        <p className="text-[12px] text-[color:var(--muted)]">
                          一致する通貨がありません。
                        </p>
                      ) : null}
                    </div>
                  )
                ) : (
                  <p className="text-[12px] text-[color:var(--muted)]">
                    国名または通貨コードを入力すると候補が表示されます。
                  </p>
                )}
                {currencyAddError ? (
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
                    {currencyAddError}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        {baseAmount !== null ? (
          <p className="text-[12px] text-[color:var(--muted)]">
            換算後: {formatCurrency(baseAmount, baseCurrency)}
          </p>
        ) : null}
        {error ? (
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="h-11 rounded-xl bg-[color:var(--accent)] px-6 text-[11px] font-semibold tracking-[0.12em] text-white transition hover:bg-[color:var(--accent-strong)]"
        >
          {isEditing ? "更新" : "追加"}
        </button>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="h-11 rounded-xl border border-[color:var(--line)] px-6 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] transition hover:border-[color:var(--muted)]"
          >
            キャンセル
          </button>
        ) : null}
      </div>
    </div>
  );
}
