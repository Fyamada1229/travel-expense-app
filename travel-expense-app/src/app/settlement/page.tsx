"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { computeSettlement, computeSummary } from "@/features/settlement/utils";
import {
  formatCurrency,
  formatDateTime,
  STORAGE_KEY,
} from "@/lib/utils";
import type { Expense, Participant, RatesMap } from "@/types";

const DEFAULT_BASE_CURRENCY = "JPY";
const DEFAULT_TRIP_TITLE = "旅の精算";

type StoredSession = {
  tripTitle?: string;
  baseCurrency?: string;
  participants?: Participant[];
  expenses?: Expense[];
  rates?: RatesMap;
  ratesUpdatedAt?: number | null;
};

const MetricTile = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) => (
  <div className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-4 shadow-soft md:px-5 md:py-5">
    <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
      {label}
    </p>
    <p className="mt-3 min-w-0 break-words font-display text-[20px] font-semibold leading-tight text-[color:var(--ink)] md:text-[22px]">
      {value}
    </p>
    {helper ? (
      <p className="mt-2 text-[12px] text-[color:var(--muted)]">{helper}</p>
    ) : null}
  </div>
);

export default function SettlementPage() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      setSession(JSON.parse(raw) as StoredSession);
    } catch {
      // Ignore corrupted session data.
    }
    setHydrated(true);
  }, []);

  const tripTitle = session?.tripTitle ?? DEFAULT_TRIP_TITLE;
  const baseCurrency = session?.baseCurrency ?? DEFAULT_BASE_CURRENCY;
  const participants = session?.participants ?? [];
  const expenses = session?.expenses ?? [];
  const ratesUpdatedAt = session?.ratesUpdatedAt ?? null;

  const rates = useMemo(
    () => ({ ...(session?.rates ?? {}), [baseCurrency]: 1 }),
    [session, baseCurrency],
  );

  const summary = useMemo(
    () => computeSummary(participants, expenses, baseCurrency, rates),
    [participants, expenses, baseCurrency, rates],
  );

  const settlement = useMemo(
    () => computeSettlement(participants, expenses, baseCurrency, rates),
    [participants, expenses, baseCurrency, rates],
  );

  const participantMap = useMemo(
    () => new Map(participants.map((participant) => [participant.id, participant.name])),
    [participants],
  );

  const hasData = participants.length > 0 || expenses.length > 0;
  const canConfirm =
    summary.missingRates === 0 &&
    participants.length > 0 &&
    expenses.length > 0;

  const handleConfirm = () => {
    if (!canConfirm || confirmed) {
      return;
    }
    setConfirmed(true);
    setConfirmedAt(Date.now());
  };

  const confirmLabel = confirmed ? "確定済み" : "この内容で確定";
  const confirmClass = confirmed
    ? "bg-emerald-600 text-white"
    : canConfirm
      ? "bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-strong)]"
      : "cursor-not-allowed bg-[color:var(--line)] text-[color:var(--muted)]";

  const handleDownloadImage = () => {
    if (!confirmed || isExporting) {
      return;
    }
    setIsExporting(true);
    setExportError(null);

    const width = 1200;
    const padding = 64;
    const baseHeight = 640;
    const lineHeight = 28;
    const height =
      baseHeight +
      settlement.transfers.length * 36 +
      participants.length * 30;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      setExportError("画像の生成に失敗しました。");
      return;
    }

    ctx.fillStyle = "#f5f7fa";
    ctx.fillRect(0, 0, width, height);

    let cursorY = padding;
    ctx.fillStyle = "#001435";
    ctx.font = "700 36px 'Noto Sans JP', sans-serif";
    ctx.fillText("最終精算の確認", padding, cursorY);
    cursorY += 46;

    ctx.font = "500 18px 'Noto Sans JP', sans-serif";
    ctx.fillText(`${tripTitle} ・ 基準通貨 ${baseCurrency}`, padding, cursorY);
    cursorY += 28;

    ctx.fillStyle = "#5c6773";
    ctx.font = "500 14px 'Noto Sans JP', sans-serif";
    const stamp = confirmedAt ? formatDateTime(confirmedAt) : formatDateTime(Date.now());
    ctx.fillText(`確定日: ${stamp}`, padding, cursorY);
    cursorY += 40;

    const drawSection = (title: string, lines: string[]) => {
      ctx.fillStyle = "#003087";
      ctx.font = "700 16px 'Noto Sans JP', sans-serif";
      ctx.fillText(title, padding, cursorY);
      cursorY += lineHeight;

      ctx.fillStyle = "#001435";
      ctx.font = "500 16px 'Noto Sans JP', sans-serif";
      lines.forEach((line) => {
        ctx.fillText(line, padding, cursorY);
        cursorY += lineHeight;
      });
      cursorY += 12;
    };

    drawSection("サマリー", [
      `総支出: ${formatCurrency(summary.total, baseCurrency)}`,
      `1人あたり: ${formatCurrency(summary.average, baseCurrency)}`,
      `参加者: ${participants.length}人`,
      `支出件数: ${expenses.length}件`,
      `精算件数: ${settlement.transfers.length}件`,
      summary.missingRates ? `不足レート: ${summary.missingRates}件` : "不足レート: なし",
    ]);

    drawSection(
      "精算リスト",
      settlement.transfers.length
        ? settlement.transfers.map((transfer, index) => {
            const from = participantMap.get(transfer.fromId) ?? "不明";
            const to = participantMap.get(transfer.toId) ?? "不明";
            return `${index + 1}. ${from} → ${to} ${formatCurrency(
              transfer.amount,
              baseCurrency,
            )}`;
          })
        : ["精算リストはありません。"],
    );

    drawSection(
      "差額一覧",
      participants.length
        ? participants.map((participant) => {
            const balance = settlement.balances[participant.id] ?? 0;
            const prefix = balance >= 0 ? "+" : "-";
            return `${participant.name}: ${prefix}${formatCurrency(
              Math.abs(balance),
              baseCurrency,
            )}`;
          })
        : ["参加者がいません。"],
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        setIsExporting(false);
        setExportError("画像の生成に失敗しました。");
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const fileStamp = new Date(confirmedAt ?? Date.now())
        .toISOString()
        .slice(0, 10);
      anchor.href = url;
      anchor.download = `settlement-${fileStamp}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }, "image/png");
  };

  const handleDownloadPdf = () => {
    if (!confirmed) {
      return;
    }
    setExportError(null);
    window.print();
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 pb-16 pt-12 md:px-8">
          <p className="text-sm text-[color:var(--muted)]">読み込み中...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 no-print">
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-(--accent)/20 blur-[100px]" />
        <div className="absolute right-4 top-24 h-72 w-72 rounded-full bg-(--mint)/25 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-(--sand)/70 blur-[130px]" />
      </div>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-20 pt-12 md:px-8 print-area">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[color:var(--muted)]">
              SETTLEMENT REVIEW
            </p>
            <h1 className="font-display text-[26px] font-semibold text-[color:var(--ink)] md:text-[32px]">
              最終精算の確認
            </h1>
            <p className="text-sm text-[color:var(--muted)]">
              {tripTitle} ・ 基準通貨 {baseCurrency}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] no-print"
          >
            編集に戻る
          </Link>
        </header>

        {!hasData ? (
          <div className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-5 py-4 text-sm text-[color:var(--muted)]">
            まだ精算データがありません。トップページで支出と参加者を登録してください。
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[color:var(--line)] bg-[linear-gradient(135deg,_rgba(0,112,186,0.92),_rgba(0,48,135,0.96))] px-6 py-6 text-white shadow-soft">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70">
              総支出
            </p>
            <p className="mt-3 font-display text-[28px] font-semibold md:text-[32px]">
              {formatCurrency(summary.total, baseCurrency)}
            </p>
            <div className="mt-4 flex flex-wrap gap-5 text-[12px] text-white/80">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                  1人あたり
                </p>
                <p className="text-sm font-semibold">
                  {formatCurrency(summary.average, baseCurrency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                  参加者
                </p>
                <p className="text-sm font-semibold">{participants.length}人</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                  支出件数
                </p>
                <p className="text-sm font-semibold">{expenses.length}件</p>
              </div>
            </div>
            {summary.missingRates ? (
              <p className="mt-4 text-[12px] text-white/70">
                不足レート {summary.missingRates}件があります。
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <MetricTile
              label="精算件数"
              value={`${settlement.transfers.length}件`}
              helper={
                settlement.transfers.length
                  ? "支払い指示の数"
                  : "精算はまだありません"
              }
            />
            <MetricTile
              label="不足レート"
              value={summary.missingRates ? `${summary.missingRates}件` : "なし"}
              helper={
                summary.missingRates
                  ? "不足分のレートを設定してください"
                  : "すべてのレートが揃っています"
              }
            />
            <MetricTile
              label="為替レート更新"
              value={ratesUpdatedAt ? formatDateTime(ratesUpdatedAt) : "未取得"}
            />
            <MetricTile label="基準通貨" value={baseCurrency} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card
            title="最終精算リスト"
            description="最小回数でまとめた支払い指示です。"
            eyebrow="精算結果"
          >
            <div className="grid gap-3">
              {settlement.transfers.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">
                  精算リストはまだありません。
                </p>
              ) : (
                settlement.transfers.map((transfer, index) => (
                  <div
                    key={`${transfer.fromId}-${transfer.toId}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--accent)] text-[11px] font-semibold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--ink)]">
                          {participantMap.get(transfer.fromId) ?? "不明"} →
                          {participantMap.get(transfer.toId) ?? "不明"}
                        </p>
                        <p className="text-[12px] text-[color:var(--muted)]">
                          支払う人 / 受け取る人
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[color:var(--ink)]">
                      {formatCurrency(transfer.amount, baseCurrency)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div className="grid gap-6">
            <Card title="差額一覧" description="受け取り・支払いの差額です。">
              <div className="grid gap-2">
                {participants.length === 0 ? (
                  <p className="text-sm text-[color:var(--muted)]">
                    参加者がまだいません。
                  </p>
                ) : (
                  participants.map((participant) => {
                    const balance = settlement.balances[participant.id] ?? 0;
                    const isPositive = balance >= 0;
                    return (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--ink)]">
                            {participant.name}
                          </p>
                          <p className="text-[12px] text-[color:var(--muted)]">
                            {isPositive ? "受け取り" : "支払い"}
                          </p>
                        </div>
                        <p
                          className={`text-[12px] font-semibold tracking-[0.12em] ${
                            isPositive ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {isPositive ? "+" : "-"}
                          {formatCurrency(Math.abs(balance), baseCurrency)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            <Card
              title="最終確認"
              description="内容に問題がなければ確定できます。"
            >
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3">
                  <span className="text-sm text-[color:var(--muted)]">
                    為替レート
                  </span>
                  <span
                    className={`text-[12px] font-semibold ${
                      summary.missingRates ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {summary.missingRates
                      ? `不足 ${summary.missingRates}件`
                      : "OK"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3">
                  <span className="text-sm text-[color:var(--muted)]">
                    最終更新
                  </span>
                  <span className="text-[12px] font-semibold text-[color:var(--ink)]">
                    {ratesUpdatedAt ? formatDateTime(ratesUpdatedAt) : "未取得"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3">
                  <span className="text-sm text-[color:var(--muted)]">
                    精算件数
                  </span>
                  <span className="text-[12px] font-semibold text-[color:var(--ink)]">
                    {settlement.transfers.length}件
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                className={`mt-5 h-11 w-full rounded-xl text-[11px] font-semibold tracking-[0.12em] transition no-print ${confirmClass}`}
                disabled={!canConfirm || confirmed}
              >
                {confirmLabel}
              </button>
              {!canConfirm ? (
                <p className="mt-3 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
                  参加者・支出・為替レートが揃うと確定できます。
                </p>
              ) : null}
              {confirmed ? (
                <p className="mt-3 text-[11px] font-semibold tracking-[0.12em] text-emerald-700">
                  精算内容を確定しました。参加者へ共有できます。
                </p>
              ) : null}
              {confirmed ? (
                <div className="mt-5 grid gap-3 no-print">
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="h-11 rounded-xl border border-[color:var(--line)] bg-white text-[11px] font-semibold tracking-[0.12em] text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                    disabled={isExporting}
                  >
                    {isExporting ? "画像を作成中..." : "PNGをダウンロード"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="h-11 rounded-xl bg-[color:var(--accent)] text-[11px] font-semibold tracking-[0.12em] text-white transition hover:bg-[color:var(--accent-strong)]"
                  >
                    PDFで保存
                  </button>
                  <p className="text-[11px] text-[color:var(--muted)]">
                    PDFは印刷ダイアログから保存できます。
                  </p>
                  {exportError ? (
                    <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
                      {exportError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
