import type { ReactNode } from "react";
import Link from "next/link";
import { CheckIcon, CircleIcon, FlaskConicalIcon } from "lucide-react";

import { DeleteSessionDialog } from "@/components/readiness/delete-session-dialog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import type { ReadinessSession } from "@/db/schema";
import { cn } from "@/lib/utils";

type ReadinessStage = "profile" | "understand" | "prepare" | "evidence";

const steps = [
  { id: "profile", label: "Profile", description: "Confirm renter facts" },
  { id: "understand", label: "Understand", description: "Inspect cited arithmetic" },
  { id: "prepare", label: "Prepare", description: "Control the packet" },
] as const;

export function ReadinessPageShell({
  session,
  current,
  title,
  description,
  actions,
  children,
  className,
}: {
  session: ReadinessSession;
  current: ReadinessStage;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const activeStep = current === "evidence" ? -1 : steps.findIndex(({ id }) => id === current);

  return (
    <>
      <PageHeader
        items={[
          { href: "/dashboard", label: "Journey" },
          { href: `/dashboard/${session.id}/${current}`, label: title },
        ]}
      />
      <div className="border-b border-border/70 bg-card/70 px-4 py-3 md:px-6">
        <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold">
              <FlaskConicalIcon className="h-3.5 w-3.5 text-amber-600" />
              Practice journey
            </span>
            <span className="text-muted-foreground">{session.metro}</span>
            <span className="text-muted-foreground">{session.program}</span>
            <Badge
              variant="outline"
              className="border-amber-500/25 bg-amber-500/6 text-amber-700 dark:text-amber-300"
            >
              2026 · practice only
            </Badge>
            <span className="font-mono text-2xs text-muted-foreground">
              Session {session.id.slice(-8)} · packet version {session.revision}
            </span>
            <span className="text-2xs text-muted-foreground">
              Guide dated {session.ruleEffectiveDate} · checklist checked {session.asOfDate}
            </span>
          </div>
          <DeleteSessionDialog sessionId={session.id} />
        </div>
      </div>

      <main
        className={cn(
          "mx-auto flex w-full max-w-[1520px] flex-1 flex-col gap-5 px-4 py-5 md:px-6 md:py-6",
          className,
        )}
      >
        {activeStep >= 0 ? (
          <nav
            aria-label="Application readiness stages"
            className="rounded-xl border border-border/80 bg-card p-2 shadow-[var(--shadow-dashboard)]"
          >
            <ol className="grid gap-1 md:grid-cols-3">
              {steps.map((step, index) => {
                const selected = index === activeStep;
                const visited = index < activeStep;
                return (
                  <li key={step.id}>
                    <Link
                      href={`/dashboard/${session.id}/${step.id}`}
                      aria-current={selected ? "step" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                        selected ? "bg-primary/9 text-foreground" : "hover:bg-muted/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                          selected || visited
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {visited ? (
                          <CheckIcon className="h-3.5 w-3.5" />
                        ) : selected ? (
                          index + 1
                        ) : (
                          <CircleIcon className="h-2.5 w-2.5" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{step.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {step.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
        {children}
      </main>
    </>
  );
}
