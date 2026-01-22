import type { CurrencyRate, RatesMap } from "@/types";
import { roundTo } from "@/lib/utils";
import { TOP_CURRENCIES, createDefaultCurrencyRates } from "./constants";

const isPositive = (value: number) => Number.isFinite(value) && value > 0;

export const normalizeCurrencyRates = (
  stored: CurrencyRate[] | null | undefined,
) => {
  if (!stored || !Array.isArray(stored)) {
    return createDefaultCurrencyRates();
  }

  const byCode = new Map<string, CurrencyRate>();
  stored.forEach((rate) => {
    if (rate && typeof rate.code === "string") {
      byCode.set(rate.code, rate);
    }
  });

  return TOP_CURRENCIES.map((currency) => {
    const matched = byCode.get(currency.code);
    const unit = matched?.unit;
    const rateToJPY = matched?.rateToJPY;
    const safeUnit = isPositive(unit ?? 0) ? (unit ?? 1) : 1;
    const safeRateToJPY = isPositive(rateToJPY ?? 0) ? (rateToJPY ?? 0) : 0;
    return {
      ...currency,
      unit: safeUnit,
      rateToJPY: safeRateToJPY,
    };
  });
};

export const buildRatesMap = (
  currencyRates: CurrencyRate[],
  baseCurrency: string,
): RatesMap => {
  const map: RatesMap = { [baseCurrency]: 1 };

  const baseRate =
    baseCurrency === "JPY"
      ? 1
      : (() => {
          const baseEntry = currencyRates.find(
            (rate) => rate.code === baseCurrency,
          );
          if (
            !baseEntry ||
            !isPositive(baseEntry.rateToJPY) ||
            !isPositive(baseEntry.unit)
          ) {
            return null;
          }
          return baseEntry.rateToJPY / baseEntry.unit;
        })();

  currencyRates.forEach((rate) => {
    if (!isPositive(rate.unit) || !isPositive(rate.rateToJPY)) {
      return;
    }
    const jpyPerUnit = rate.rateToJPY / rate.unit;
    if (baseRate && baseCurrency !== "JPY") {
      map[rate.code] = roundTo(jpyPerUnit / baseRate, 6);
      return;
    }
    if (baseCurrency === "JPY") {
      map[rate.code] = roundTo(jpyPerUnit, 6);
    }
  });

  return map;
};
