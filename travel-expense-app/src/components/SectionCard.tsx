import type { ReactNode } from "react";

const combine = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

type SectionCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={combine(
        "rounded-3xl border border-[color:var(--line)] bg-white/70 shadow-soft backdrop-blur",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--line)] px-6 pb-4 pt-6">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[color:var(--muted)]">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-1">
            <h2 className="font-display text-[18px] font-semibold text-[color:var(--ink)]">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-[color:var(--muted)]">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="self-center">{action}</div> : null}
      </header>
      <div className="px-6 pb-6 pt-5">{children}</div>
    </section>
  );
}
