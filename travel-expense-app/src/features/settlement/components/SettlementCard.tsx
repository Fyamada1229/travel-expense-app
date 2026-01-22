import Link from "next/link";
import type { Participant, SettlementTransfer } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Card from "@/components/ui/Card";

type SettlementCardProps = {
  transfers: SettlementTransfer[];
  participants: Participant[];
  balances: Record<string, number>;
  baseCurrency: string;
  missingRates: number;
};

export default function SettlementCard({
  transfers,
  participants,
  balances,
  baseCurrency,
  missingRates,
}: SettlementCardProps) {
  const participantMap = new Map(
    participants.map((participant) => [participant.id, participant.name]),
  );

  return (
    <Card
      title="精算"
      description="最小回数で精算します。"
      eyebrow="精算"
      action={
        <Link
          href="/settlement"
          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-[11px] font-semibold tracking-[0.12em] text-white transition hover:bg-[color:var(--accent-strong)]"
        >
          精算結果を確認
        </Link>
      }
    >
      <div className="grid gap-4">
        {missingRates ? (
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)] md:text-[12px] lg:text-[13px]">
            不足している為替レートを入力すると精算が確定します。
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[color:var(--muted)] md:text-[11px] lg:text-[12px]">
              精算リスト
            </p>
            {transfers.length === 0 ? (
              <p className="text-[12px] text-[color:var(--muted)] md:text-[13px] lg:text-[14px]">
                まだ精算はありません。
              </p>
            ) : (
              transfers.map((transfer, index) => (
                <div
                  key={`${transfer.fromId}-${transfer.toId}-${index}`}
                  className="flex flex-col gap-2 rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <p className="text-[12px] font-semibold text-[color:var(--ink)] md:text-[13px] lg:text-[14px]">
                    {participantMap.get(transfer.fromId) ?? "不明"} から{" "}
                    {participantMap.get(transfer.toId) ?? "不明"} へ支払い
                  </p>
                  <p className="text-[11px] font-semibold text-[color:var(--ink)] md:text-[12px] lg:text-[13px]">
                    {formatCurrency(transfer.amount, baseCurrency)}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="grid gap-2">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[color:var(--muted)] md:text-[11px] lg:text-[12px]">
              差額
            </p>
            <div className="grid gap-2">
              {participants.map((participant) => {
                const balance = balances[participant.id] ?? 0;
                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-2 md:px-5 md:py-3"
                  >
                    <span className="text-[12px] text-[color:var(--ink)] md:text-[13px] lg:text-[14px]">
                      {participant.name}
                    </span>
                    <span
                      className={`text-[11px] font-semibold tracking-[0.1em] md:text-[12px] lg:text-[13px] ${
                        balance >= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {balance >= 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(balance), baseCurrency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
