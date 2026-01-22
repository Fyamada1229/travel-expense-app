import type { Participant, SettlementTransfer } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";
import SectionCard from "@/components/SectionCard";

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
    <SectionCard
      title="精算"
      description="最小回数で精算します。"
      eyebrow="精算"
    >
      <div className="grid gap-4">
        {missingRates ? (
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--warning)]">
            不足している為替レートを入力すると精算が確定します。
          </p>
        ) : null}
        <div className="grid gap-3">
          {transfers.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">
              まだ精算はありません。
            </p>
          ) : (
            transfers.map((transfer, index) => (
              <div
                key={`${transfer.fromId}-${transfer.toId}-${index}`}
                className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3"
              >
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  {participantMap.get(transfer.fromId) ?? "不明"} から{" "}
                  {participantMap.get(transfer.toId) ?? "不明"} へ支払い
                </p>
                <p className="text-xs text-[color:var(--muted)]">
                  {formatCurrency(transfer.amount, baseCurrency)}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="grid gap-2">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--muted)]">
            差額
          </p>
          <div className="grid gap-2">
            {participants.map((participant) => {
              const balance = balances[participant.id] ?? 0;
              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-2"
                >
                  <span className="text-sm text-[color:var(--ink)]">
                    {participant.name}
                  </span>
                  <span
                    className={`text-[11px] font-semibold tracking-[0.1em] ${
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
    </SectionCard>
  );
}
