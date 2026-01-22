import type { RatesMap } from "@/types";

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export type CurrencyOption = {
  code: string;
  country: string;
  name: string;
  search: string[];
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "JPY", country: "日本", name: "日本円", search: ["Japan", "Yen"] },
  { code: "USD", country: "アメリカ", name: "米ドル", search: ["USA", "Dollar"] },
  { code: "EUR", country: "ユーロ圏", name: "ユーロ", search: ["Europe", "Euro"] },
  {
    code: "GBP",
    country: "イギリス",
    name: "英ポンド",
    search: ["UK", "Pound"],
  },
  {
    code: "AUD",
    country: "オーストラリア",
    name: "豪ドル",
    search: ["Australia", "Dollar"],
  },
  {
    code: "CAD",
    country: "カナダ",
    name: "カナダドル",
    search: ["Canada", "Dollar"],
  },
  {
    code: "CHF",
    country: "スイス",
    name: "スイスフラン",
    search: ["Switzerland", "Franc"],
  },
  {
    code: "CNY",
    country: "中国",
    name: "人民元",
    search: ["China", "Yuan", "Renminbi"],
  },
  {
    code: "KRW",
    country: "韓国",
    name: "韓国ウォン",
    search: ["Korea", "Won"],
  },
  {
    code: "SGD",
    country: "シンガポール",
    name: "シンガポールドル",
    search: ["Singapore", "Dollar"],
  },
  {
    code: "THB",
    country: "タイ",
    name: "タイバーツ",
    search: ["Thailand", "Baht"],
  },
  {
    code: "TWD",
    country: "台湾",
    name: "台湾ドル",
    search: ["Taiwan", "Dollar"],
  },
  {
    code: "VND",
    country: "ベトナム",
    name: "ベトナムドン",
    search: ["Vietnam", "Dong"],
  },
];

export const DEFAULT_CURRENCIES = CURRENCY_OPTIONS.map(
  (option) => option.code,
);

export const getCurrencyOption = (code: string) =>
  CURRENCY_OPTIONS.find((option) => option.code === code);

export const getCurrencyLabel = (code: string) => {
  const option = getCurrencyOption(code);
  if (!option) {
    return code;
  }
  return `${option.country} (${option.code})`;
};

export const STORAGE_KEY = "travel-expense-session-v1";

export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getCurrencyDigits = (currency: string) => {
  try {
    const resolved = new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits;
    return typeof resolved === "number" ? resolved : currency === "JPY" ? 0 : 2;
  } catch {
    return currency === "JPY" ? 0 : 2;
  }
};

export const roundTo = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const formatCurrency = (value: number, currency: string) => {
  const digits = getCurrencyDigits(currency);
  try {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${roundTo(value, digits)} ${currency}`;
  }
};

export const formatDateTime = (value: number) => {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const getRateToBase = (
  currency: string,
  baseCurrency: string,
  rates: RatesMap,
) => {
  if (currency === baseCurrency) {
    return 1;
  }
  const rate = rates[currency];
  if (!rate || rate <= 0) {
    return null;
  }
  return rate;
};

export const computeBaseAmount = (
  amount: number,
  currency: string,
  baseCurrency: string,
  rates: RatesMap,
) => {
  const rate = getRateToBase(currency, baseCurrency, rates);
  if (!rate) {
    return null;
  }
  return amount * rate;
};

export const rebaseRates = (
  rates: RatesMap,
  oldBase: string,
  newBase: string,
) => {
  if (oldBase === newBase) {
    return { rates, success: true };
  }
  const oldRateForNewBase = rates[newBase];
  if (!oldRateForNewBase || oldRateForNewBase <= 0) {
    return {
      rates: {
        [newBase]: 1,
      },
      success: false,
    };
  }

  const rebased: RatesMap = {};
  Object.entries(rates).forEach(([currency, rate]) => {
    if (!rate || rate <= 0) {
      return;
    }
    if (currency === newBase) {
      rebased[currency] = 1;
      return;
    }
    rebased[currency] = roundTo(rate / oldRateForNewBase, 6);
  });

  rebased[newBase] = 1;
  return { rates: rebased, success: true };
};
