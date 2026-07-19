import type { Metadata } from "next";
import {
  BotIcon,
  DatabaseIcon,
  LockKeyholeIcon,
  Trash2Icon,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FROZEN_RULES } from "@/features/readiness/corpus";

export const metadata: Metadata = { title: "Data we use" };

export default function DataWeUsePage() {
  return (
    <>
      <PageHeader
        items={[
          { href: "/dashboard", label: "Sessions" },
          { href: "/dashboard/data-we-use", label: "Data we use" },
        ]}
      />
      <main className="mx-auto flex w-full max-w-[1520px] flex-1 flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Data we use
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            What enters your private application-readiness journey, how RealDoor uses it, what stays
            out, and how you remove it.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard
            icon={LockKeyholeIcon}
            title="Session content"
            badge="Private"
            body="Your files, suggested facts, evidence excerpts, questions, and answers stay inside your private session. Nothing is sent to a property unless you download it yourself."
          />
          <InfoCard
            icon={BotIcon}
            title="Document reading"
            badge="Suggestions only"
            body="When needed, RealDoor can suggest only the small set of fields you see on screen. Every suggestion waits for your review, and each document-based suggestion must show the exact supporting words."
          />
          <InfoCard
            icon={DatabaseIcon}
            title="Practice guide"
            badge="Cited"
            body="Rule answers use only the passages you can open in the app. The comparison uses a fixed practice guide and always shows its date, area, program, and practice-only status."
          />
          <InfoCard
            icon={Trash2Icon}
            title="Deletion"
            badge="You control it"
            body="Deleting a session removes its saved files and private session details. A packet already downloaded to your device stays under your control."
          />
        </section>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">What RealDoor does—and does not do</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <Boundary
              title="Used in later steps"
              items={[
                "Facts you confirmed",
                "The date and location of the practice guide",
                "Visible arithmetic",
                "Documents you chose to include",
              ]}
            />
            <Boundary
              title="Kept unresolved"
              items={[
                "Suggestions you have not confirmed",
                "Conflicting document values",
                "Missing dates or household size",
                "Questions the saved guide cannot answer",
              ]}
            />
            <Boundary
              title="Never generated"
              items={[
                "Eligibility decisions",
                "Approval or denial predictions",
                "Readiness scores or ranks",
                "Automatic submissions or sends",
              ]}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Fields RealDoor can use</CardTitle>
            <p className="text-sm text-muted-foreground">
              A document value affects the worksheet, checklist, or packet only after you confirm
              it. Anything outside this list is ignored.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border/70 bg-muted/15 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Field</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Why it is read</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Source</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Where it can appear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {fieldUses.map((field) => (
                  <tr key={field.label}>
                    <th scope="row" className="px-4 py-3 font-semibold">{field.label}</th>
                    <td className="px-4 py-3 text-muted-foreground">{field.purpose}</td>
                    <td className="px-4 py-3 text-muted-foreground">{field.source}</td>
                    <td className="px-4 py-3 text-muted-foreground">{field.effects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Frozen guide sources</CardTitle>
            <p className="text-sm text-muted-foreground">
              The active corpus contains {FROZEN_RULES.length} saved passages. Rule answers never
              search the web or fill gaps from memory.
            </p>
          </CardHeader>
          <CardContent className="divide-y divide-border/70 p-0">
            {FROZEN_RULES.map((rule) => (
              <section key={rule.ruleId} className="space-y-1 px-5 py-4">
                <h2 className="text-sm font-bold">{rule.ruleId} · {rule.sourceLocator}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{rule.text}</p>
                <p className="text-xs text-muted-foreground">
                  {rule.authority.replaceAll("_", " ")}
                  {rule.effectiveDate ? ` · effective ${rule.effectiveDate}` : ""}
                </p>
              </section>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

const fieldUses = [
  { label: "Name and address", purpose: "Match documents to the same renter record.", source: "Application summary or supporting document", effects: "Profile, evidence trail, selected packet facts" },
  { label: "Household size", purpose: "Select the matching 2026 household-size threshold.", source: "Application summary or renter entry", effects: "Threshold worksheet and packet" },
  { label: "Application date", purpose: "Show when the application summary was prepared.", source: "Application summary", effects: "Checklist evidence and packet index" },
  { label: "Pay date and pay-period dates", purpose: "Trace a pay statement and calculate its age.", source: "Pay statement", effects: "Checklist, evidence trail, packet" },
  { label: "Pay frequency", purpose: "Choose the explicit annualization multiplier.", source: "Pay statement", effects: "Income worksheet and packet" },
  { label: "Regular or weekly hours", purpose: "Show the hours used for recurring wages.", source: "Pay statement or employment letter", effects: "Income worksheet and evidence trail" },
  { label: "Hourly rate", purpose: "Calculate documented recurring wages.", source: "Pay statement or employment letter", effects: "Income worksheet and packet" },
  { label: "Gross pay", purpose: "Annualize recurring wages when frequency is explicit.", source: "Pay statement", effects: "Income worksheet, conflict review, packet" },
  { label: "Net pay", purpose: "Keep the source record inspectable; it is not used in gross-income math.", source: "Pay statement", effects: "Profile and evidence trail only" },
  { label: "Document date", purpose: "Calculate document age against the frozen as-of date.", source: "Employment or benefit letter", effects: "Checklist and packet" },
  { label: "Monthly benefit and frequency", purpose: "Annualize an independently documented recurring benefit.", source: "Benefit letter", effects: "Income worksheet and packet" },
  { label: "Statement month", purpose: "Identify the period covered by a gig statement.", source: "Gig statement", effects: "Checklist and evidence trail" },
  { label: "Gross receipts", purpose: "Show documented recurring gig receipts under the frozen convention.", source: "Gig statement", effects: "Income worksheet, review state, packet" },
  { label: "Platform fees", purpose: "Keep the source statement inspectable; fees do not silently change gross receipts.", source: "Gig statement", effects: "Profile and evidence trail only" },
] as const;

function InfoCard({
  icon: Icon,
  title,
  badge,
  body,
}: {
  icon: typeof DatabaseIcon;
  title: string;
  badge: string;
  body: string;
}) {
  return (
    <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/9 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <Badge variant="outline">{badge}</Badge>
        </div>
        <h2 className="mt-4 text-base font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function Boundary({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-xl border border-border bg-muted/18 p-4">
      <h2 className="text-sm font-bold">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
