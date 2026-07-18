import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalculatorIcon,
  CircleHelpIcon,
  EqualIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { ReadinessPageShell } from "@/components/readiness/readiness-page-shell";
import { RuleQuestionForm } from "@/components/readiness/rule-question-form";
import { SourceCitationDialog } from "@/components/readiness/source-citation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { summarizeConfirmedIncome } from "@/features/readiness/domain";
import { getRuleSource } from "@/features/readiness/rules";
import { getReadinessWorkspace } from "@/features/readiness/server";
import { requireVerifiedPageSession } from "@/utils/auth-page";

export const metadata: Metadata = { title: "Understand · Application readiness" };

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const factLabels: Record<string, string> = {
  household_size: "Household size",
  employment_monthly_income: "Employment",
  benefits_monthly_income: "Benefits",
  other_monthly_income: "Other income",
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
      title="Understand the arithmetic and its limits"
      description="Every number below comes from a fact you confirmed or the clearly labeled practice guide. The comparison is an explanation, not an application outcome."
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
        <strong>For practice only:</strong> the official 2026 materials needed for a real
        application are not included here. Vidicy does not substitute an older year. The values
        below only let you practice the review process.
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalculatorIcon className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-base">
                  How your income comparison was calculated
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your confirmed monthly amounts → annual total → cited practice benchmark →
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
                    label="Practice 60% benchmark"
                    value={money.format(comparison.incomeLimit)}
                    tone="amber"
                  />
                  <Metric
                    label="Arithmetic difference"
                    value={money.format(Math.abs(comparison.difference))}
                    detail={`${comparison.relationship} the practice benchmark`}
                    tone="neutral"
                  />
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Formula
                  </p>
                  <p className="mt-2 font-mono text-sm font-semibold">{income.formula}</p>
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
                          {fact.key === "household_size"
                            ? fact.value
                            : `${money.format(Number(fact.value))} / month`}
                        </span>
                      </div>
                    ))}
                </div>

                <div>
                  <p className="text-xs font-bold">Sources used</p>
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
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <ShieldAlertIcon className="h-7 w-7 text-status-warning" />
                <h2 className="mt-3 text-base font-bold">Arithmetic remains unresolved</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {comparison.status === "unresolved"
                    ? comparison.reason
                    : "Confirm all four calculation inputs first."}
                </p>
                <Button asChild className="mt-5">
                  <Link href={`/dashboard/${appId}/profile`}>Review Profile inputs</Link>
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
              <p className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Guide details
              </p>
              <dl className="mt-3 space-y-3 text-xs">
                <ContextRow label="Program" value={workspace.rulePack.program} />
                <ContextRow label="Metro" value={workspace.rulePack.metro} />
                <ContextRow label="Version" value={workspace.rulePack.version} />
                <ContextRow label="Guide date" value={workspace.rulePack.effectiveDate} />
              </dl>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <div className="flex items-start gap-3">
              <CircleHelpIcon className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Ask a rule question</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Answers use only the saved practice guide shown here.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <RuleQuestionForm sessionId={appId} />
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Question history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {workspace.questions.length > 0 ? (
              <div className="divide-y divide-border/70">
                {workspace.questions.map((question) => {
                  const sourceIds = JSON.parse(question.sourceIds) as string[];
                  return (
                    <article key={question.id} className="space-y-3 p-5">
                      <p className="text-sm font-bold">{question.payload.question}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {question.payload.answer}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sourceIds.length > 0 ? (
                          sourceIds.map((sourceId) => {
                            const source = getRuleSource(sourceId);
                            return source ? (
                              <SourceCitationDialog
                                key={source.id}
                                source={source}
                                version={workspace.rulePack.version}
                                effectiveDate={workspace.rulePack.effectiveDate}
                              />
                            ) : null;
                          })
                        ) : (
                          <Badge variant="outline">
                            No answer shown · guide did not cover this
                          </Badge>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">
                No questions yet. Try “How is monthly income annualized?”
              </p>
            )}
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
      <p className="text-xs font-semibold opacity-75">{label}</p>
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
