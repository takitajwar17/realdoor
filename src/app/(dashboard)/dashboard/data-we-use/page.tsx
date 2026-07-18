import type { Metadata } from "next";
import Link from "next/link";
import {
  BotIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FileWarningIcon,
  LockKeyholeIcon,
  Trash2Icon,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Data we use · Application readiness" };

export default function DataWeUsePage() {
  return (
    <>
      <PageHeader
        items={[
          { href: "/dashboard", label: "Journey" },
          { href: "/dashboard/data-we-use", label: "Data we use" },
        ]}
      />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        <div>
          <Badge variant="outline" className="border-primary/20 bg-primary/7 text-primary">Trust and provenance</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Data we use</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            What enters the authenticated application-readiness experience, how it is used, what is deliberately excluded, and how you remove it.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard
            icon={LockKeyholeIcon}
            title="Session content"
            badge="Encrypted"
            body="Uploaded document bytes are encrypted before R2 storage. Filenames, extracted values, evidence excerpts, questions, and answers are encrypted before D1 persistence. Encryption is bound to the session and record identifier."
          />
          <InfoCard
            icon={BotIcon}
            title="AI processing"
            badge="Candidate extraction only"
            body="OpenAI may process a synthetic upload when native PDF text extraction or image reading is needed. Its output is constrained to an explicit field allowlist, treated as unconfirmed, and checked for source excerpts before display. Perplexity is not used for rule answers."
          />
          <InfoCard
            icon={DatabaseIcon}
            title="Frozen rule corpus"
            badge="Cited"
            body="The rule answerer uses only the source passages shown in the app. It does not search the live web. Numerical comparison uses a fixed synthetic 2026 rehearsal pack and always exposes its version, effective date, metro, program, and non-authoritative status."
          />
          <InfoCard
            icon={Trash2Icon}
            title="Deletion"
            badge="Renter controlled"
            body="Deleting a session removes its encrypted object-storage files first, then its session-linked D1 rows. The app fails closed if production storage cannot be reached. A packet previously downloaded to your device remains yours to delete locally."
          />
        </section>

        <Card className="rounded-xl border-amber-500/25 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-amber-500/20 bg-amber-500/6">
            <div className="flex items-start gap-3">
              <FileWarningIcon className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-300" />
              <div>
                <CardTitle className="text-base">Known source gap: the 2026 organizer pack is absent</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Verified against the checked-in data inventory on July 19, 2026.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-sm leading-6">
            <p>
              The repository contains FY2025 HUD MTSP spreadsheets and briefing material, plus public LIHTC property data. It does <strong>not</strong> contain the PRD’s promised synthetic organizer documents, gold evidence boxes, checklist, adversarial pack, or organizer-provided 2026 rules.
            </p>
            <p className="text-muted-foreground">
              Vidicy does not silently reuse FY2025 values for a 2026 session. The built-in numbers and PDFs are team-generated synthetic rehearsal fixtures and are labeled that way in every derived surface.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="https://www.huduser.gov/portal/datasets/mtsp.html" target="_blank" rel="noreferrer">
                  HUD MTSP source <ExternalLinkIcon className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link
                  href="https://www.huduser.gov/portal/datasets/il/il26/Statement-on-FY-2026-Income-Limits.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  HUD FY2026 release statement <ExternalLinkIcon className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="https://www.irs.gov/pub/irs-utl/8823-guide.pdf" target="_blank" rel="noreferrer">
                  IRS Form 8823 guide <ExternalLinkIcon className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">Data flow and non-goals</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <Boundary title="Allowed downstream" items={["Renter-confirmed fact values", "Cited pack metadata", "Deterministic formulas", "Explicit document inclusion choices"]} />
            <Boundary title="Held unresolved" items={["Unconfirmed candidates", "Conflicting document values", "Missing dates or household size", "Questions outside the frozen corpus"]} />
            <Boundary title="Never generated" items={["Eligibility decisions", "Approval or denial predictions", "Readiness scores or ranks", "Automatic submissions or sends"]} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function InfoCard({ icon: Icon, title, badge, body }: { icon: typeof DatabaseIcon; title: string; badge: string; body: string }) {
  return (
    <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/9 text-primary"><Icon className="h-5 w-5" /></span>
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
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
