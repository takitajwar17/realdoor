import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalculatorIcon,
  EqualIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { toChatMessages } from "@/components/readiness/readiness-chat-widget";
import { ReadinessPageShell } from "@/components/readiness/readiness-page-shell";
import { SourceCitationDialog } from "@/components/readiness/source-citation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { summarizeConfirmedIncome } from "@/features/readiness/domain";
import { formatMetroLabel, formatProgramLabel } from "@/features/readiness/presentation";
import { getRuleSource } from "@/features/readiness/rules";
import { hasOpenableSourceUrl } from "@/features/readiness/source-url";
import { getReadinessWorkspace } from "@/features/readiness/server";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export const metadata: Metadata = { title: "Understand" };

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const factLabels: Record<string, string> = {
  household_size: "Household size",
  weekly_hours: "Weekly hours",
  hourly_rate: "Hourly rate",
  monthly_benefit: "Monthly benefit",
  gross_pay: "Gross pay",
  regular_hours: "Regular hours",
};

export default async function UnderstandPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const auth = await requireVerifiedPageSession(`/dashboard/${appId}/understand`);
  let workspace: Awaited<ReturnType<typeof getReadinessWorkspace>>;
  try {
    workspace = await getReadinessWorkspace(appId, auth.userId);
  } catch {
    notFound();
  }

  const income = summarizeConfirmedIncome(workspace.confirmedFacts);
  const comparison = workspace.comparison;

  return (
    <ReadinessPageShell
      session={workspace.session}
      current="understand"
      title="Understand the math"
      description="Every number below comes from a fact you confirmed or the frozen 2026 guide. This is an explanation only—not an application decision. Use the chat button for guide questions."
      chatMessages={toChatMessages(workspace.questions)}
      chatSources={workspace.rulePack.sources}
      ruleVersion={workspace.rulePack.version}
      ruleEffectiveDate={workspace.rulePack.effectiveDate}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/${appId}/profile`}>
              <ArrowLeftIcon className="h-4 w-4" /> Profile
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/${appId}/prepare`}>
              Continue to Prepare <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/7 px-4 py-3 text-sm leading-6 text-amber-950 dark:text-amber-100">
        <strong>Frozen reference, not a decision.</strong> The household-size limit is from HUD’s FY
        2026 MTSP table for this area. A property still makes every application determination.
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalculatorIcon className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-base">How your income comparison works</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirmed recurring sources → annualized total → cited 2026 threshold →
                  difference.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {comparison.status === "complete" && income.status === "complete" ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric
                    label="Confirmed annual income"
                    value={money.format(comparison.annualIncome)}
                    tone="primary"
                  />
                  <Metric
                    label="Frozen 60% threshold"
                    value={money.format(comparison.incomeLimit)}
                    tone="amber"
                  />
                  <Metric
                    label="Difference"
                    value={money.format(Math.abs(comparison.difference))}
                    detail={`${comparison.relationship} the frozen threshold`}
                    tone="neutral"
                  />
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    How it was calculated
                  </p>
                  <p className="mt-2 font-mono text-sm font-semibold">{income.formula}</p>
                  <div className="mt-3 space-y-2">
                    {income.components.map((component) => (
                      <p key={component.label} className="font-mono text-xs text-muted-foreground">
                        {component.formula}
                      </p>
                    ))}
                  </div>
                  <div className="my-4 flex items-center gap-3 text-muted-foreground">
                    <Separator className="flex-1" />
                    <EqualIcon className="h-4 w-4" />
                    <Separator className="flex-1" />
                  </div>
                  <p className="font-mono text-sm font-semibold">{comparison.formula}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {workspace.confirmedFacts
                    .filter((fact) => fact.key in factLabels)
                    .map((fact) => (
                      <div
                        key={fact.key}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm"
                      >
                        <span className="text-muted-foreground">{factLabels[fact.key]}</span>
                        <span className="font-bold">
                          {fact.key === "household_size" || fact.key.includes("hours")
                            ? fact.value
                            : money.format(Number(fact.value))}
                        </span>
                      </div>
                    ))}
                </div>

                {comparison.sourceIds.some((sourceId) => {
                  const source = getRuleSource(sourceId);
                  return source ? hasOpenableSourceUrl(source.url) : false;
                }) ? (
                  <div>
                    <p className="text-xs font-bold">Sources</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {comparison.sourceIds.map((sourceId) => {
                        const source = getRuleSource(sourceId);
                        return source ? (
                          <SourceCitationDialog
                            key={source.id}
                            source={source}
                            version={workspace.rulePack.version}
                            effectiveDate={workspace.rulePack.effectiveDate}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                <ShieldAlertIcon className="h-6 w-6 text-status-warning" />
                <p className="mt-3 text-sm font-bold">Comparison not ready yet</p>
                <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                  {comparison.status === "unresolved"
                    ? comparison.reason
                    : "Confirm household size and income facts in Profile first."}
                </p>
                <Button asChild className="mt-5">
                  <Link href={`/dashboard/${appId}/profile`}>Back to Profile</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">What this cannot tell you</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-sm leading-6">
            <p>
              This comparison does <strong>not</strong> determine eligibility, qualification,
              approval, denial, priority, or likelihood.
            </p>
            <p className="text-muted-foreground">
              A real property may use unit designations, income definitions, asset rules,
              verification dates, household composition rules, and local procedures that are not
              present in this practice guide.
            </p>
            <div className="rounded-xl border border-border bg-muted/25 p-4">
              <p className="text-2xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Frozen guide in use
              </p>
              <dl className="mt-3 space-y-3 text-xs">
                <ContextRow
                  label="Program"
                  value={formatProgramLabel(workspace.rulePack.program)}
                />
                <ContextRow label="Area" value={formatMetroLabel(workspace.rulePack.metro)} />
                <ContextRow label="Year" value={String(workspace.rulePack.year)} />
                <ContextRow label="Dated" value={workspace.rulePack.effectiveDate} />
              </dl>
            </div>
          </CardContent>
        </Card>
      </section>
    </ReadinessPageShell>
  );
}

function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: "primary" | "amber" | "neutral";
}) {
  const className =
    tone === "primary"
      ? "bg-primary/8 text-primary"
      : tone === "amber"
        ? "bg-amber-500/8 text-amber-700 dark:text-amber-300"
        : "bg-muted/50 text-foreground";
  return (
    <div className={`rounded-xl border border-border p-4 ${className}`}>
      <p className="text-2xs font-bold uppercase tracking-[0.12em] opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {detail ? <p className="mt-1 text-xs opacity-70">{detail}</p> : null}
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
