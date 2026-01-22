import type { CurrencyRate } from "@/types";

export const TOP_CURRENCIES: Array<Pick<
  CurrencyRate,
  "code" | "name" | "country" | "rank"
>> = [
  { code: "USD", name: "米ドル", country: "アメリカ", rank: 1 },
  { code: "KRW", name: "韓国ウォン", country: "韓国", rank: 2 },
  { code: "TWD", name: "台湾ドル", country: "台湾", rank: 3 },
  { code: "THB", name: "タイバーツ", country: "タイ", rank: 4 },
  { code: "EUR", name: "ユーロ", country: "ユーロ圏", rank: 5 },
  { code: "SGD", name: "シンガポールドル", country: "シンガポール", rank: 6 },
  { code: "CNY", name: "人民元", country: "中国", rank: 7 },
  { code: "HKD", name: "香港ドル", country: "香港", rank: 8 },
  { code: "AUD", name: "豪ドル", country: "オーストラリア", rank: 9 },
  { code: "GBP", name: "英ポンド", country: "イギリス", rank: 10 },
];

export const TOP_CURRENCY_CODES = TOP_CURRENCIES.map(
  (currency) => currency.code,
);

export const BASE_CURRENCY_CODES = ["JPY", ...TOP_CURRENCY_CODES];

export const TOP_CURRENCY_DESKTOP_COUNT = 10;
export const TOP_CURRENCY_MOBILE_COUNT = 3;

export const createDefaultCurrencyRates = (): CurrencyRate[] =>
  TOP_CURRENCIES.map((currency) => ({
    ...currency,
    unit: 1,
    rateToJPY: 0,
  }));
