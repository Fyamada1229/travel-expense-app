import { NextResponse } from "next/server";
import { DEFAULT_CURRENCIES } from "@/lib/utils";

const BASE_URL =
  process.env.EXCHANGERATE_BASE_URL ?? "https://api.exchangerate.host";
const ACCESS_KEY = process.env.EXCHANGERATE_ACCESS_KEY;
const TIMEOUT_MS = Number(process.env.EXCHANGERATE_TIMEOUT_MS ?? "5000");
const CACHE_TTL_MS = 5 * 60 * 1000;

const isCurrencyCode = (value: string) => /^[A-Z]{3}$/.test(value);
const allowedCurrencies = new Set(
  DEFAULT_CURRENCIES.map((currency) => currency.toUpperCase()),
);

type CachedRates = {
  success: true;
  base: string;
  date?: string;
  rates: Record<string, number>;
};

const cache = new Map<string, { data: CachedRates; expiresAt: number }>();

const buildEndpoint = (baseUrl: string, path: string) => {
  const trimmed = baseUrl.replace(/\/$/, "");
  return `${trimmed}/${path}`;
};

const shouldUseHeaderOnly = (baseUrl: URL) =>
  baseUrl.hostname.endsWith("apilayer.com");

const shouldUseLiveEndpoint = (baseUrl: URL) =>
  baseUrl.hostname.endsWith("exchangerate.host");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawBase = (searchParams.get("base") ?? "USD").toUpperCase();
  const aliasMap: Record<string, string> = { JPN: "JPY" };
  const base = aliasMap[rawBase] ?? rawBase;

  let safeBaseUrl: URL;
  try {
    safeBaseUrl = new URL(BASE_URL);
  } catch {
    return NextResponse.json(
      { success: false, error: { info: "Invalid base URL." } },
      { status: 500 },
    );
  }

  if (safeBaseUrl.protocol !== "https:") {
    return NextResponse.json(
      { success: false, error: { info: "Base URL must use https." } },
      { status: 500 },
    );
  }

  if (!isCurrencyCode(base)) {
    return NextResponse.json(
      { success: false, error: { info: "Invalid base currency." } },
      { status: 400 },
    );
  }

  if (!allowedCurrencies.has(base)) {
    return NextResponse.json(
      { success: false, error: { info: "Unsupported base currency." } },
      { status: 400 },
    );
  }

  if (!ACCESS_KEY) {
    return NextResponse.json(
      { success: false, error: { info: "Missing API key." } },
      { status: 500 },
    );
  }

  const cached = cache.get(base);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data, {
      status: 200,
      headers: { "Cache-Control": "private, max-age=300" },
    });
  }

  const useLiveEndpoint = shouldUseLiveEndpoint(safeBaseUrl);
  const endpoint = buildEndpoint(
    safeBaseUrl.toString(),
    useLiveEndpoint ? "live" : "latest",
  );
  const url = new URL(endpoint);
  if (useLiveEndpoint) {
    url.searchParams.set("source", base);
  } else {
    url.searchParams.set("base", base);
  }
  const useHeaderOnly = shouldUseHeaderOnly(safeBaseUrl);
  if (!useHeaderOnly) {
    url.searchParams.set("access_key", ACCESS_KEY);
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const headers: HeadersInit = { Accept: "application/json" };
    if (useHeaderOnly) {
      headers.apikey = ACCESS_KEY;
    }
    const response = await fetch(url.toString(), {
      cache: "no-store",
      signal: controller.signal,
      headers,
    });
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: { info: "Failed to fetch rates." } },
        { status: response.status },
      );
    }
    const data = (await response.json()) as {
      success?: boolean;
      base?: string;
      date?: string;
      rates?: Record<string, number>;
      source?: string;
      quotes?: Record<string, number>;
      error?: { info?: string };
    };
    const ratesFromQuotes = (payload: {
      source?: string;
      quotes?: Record<string, number>;
    }) => {
      const source = (payload.source ?? base).toUpperCase();
      const entries = Object.entries(payload.quotes ?? {});
      const mapped: Record<string, number> = {};
      entries.forEach(([pair, value]) => {
        if (pair.length !== 6) {
          return;
        }
        const prefix = pair.slice(0, 3).toUpperCase();
        const target = pair.slice(3).toUpperCase();
        if (prefix !== source || !Number.isFinite(value)) {
          return;
        }
        mapped[target] = value;
      });
      return mapped;
    };

    const normalizedRates =
      data.rates ?? ratesFromQuotes({ source: data.source, quotes: data.quotes });

    if (
      data.success === false ||
      !normalizedRates ||
      !Object.keys(normalizedRates).length
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { info: data.error?.info ?? "Rates not available." },
        },
        { status: 502 },
      );
    }

    const payload: CachedRates = {
      success: true,
      base: data.base ?? base,
      date: data.date,
      rates: normalizedRates,
    };
    cache.set(base, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { info: "Failed to fetch rates." } },
      { status: 502 },
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
