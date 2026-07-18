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
          <Badge variant="outline" className="border-primary/20 bg-primary/7 text-primary">
            Your data and sources
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Data we use</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            What enters your private application-readiness journey, how Vidicy uses it, what stays
            out, and how you remove it.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard
            icon={LockKeyholeIcon}
            title="Session content"
            badge="Encrypted"
            body="Your files are encrypted before they are saved. Filenames, suggested facts, evidence excerpts, questions, and answers are also encrypted and kept inside your private session."
          />
          <InfoCard
            icon={BotIcon}
            title="AI processing"
            badge="Suggestions only"
            body="OpenAI may read a practice file when its text cannot be read directly. It can suggest only the small set of fields you see in Vidicy. Every suggestion waits for your review, and each document-based suggestion must show the exact supporting words."
          />
          <InfoCard
            icon={DatabaseIcon}
            title="Saved practice guide"
            badge="Cited"
            body="Rule answers use only the passages you can open in the app; they do not search the live web. The comparison uses a fixed 2026 practice guide and always shows its date, location, program, version, and practice-only status."
          />
          <InfoCard
            icon={Trash2Icon}
            title="Deletion"
            badge="Renter controlled"
            body="Deleting a session removes its saved files and private session details. If Vidicy cannot remove every saved file, it will not claim that deletion succeeded. A packet already downloaded to your device stays under your control."
          />
        </section>

        <Card className="rounded-xl border-amber-500/25 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-amber-500/20 bg-amber-500/6">
            <div className="flex items-start gap-3">
              <FileWarningIcon className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-300" />
              <div>
                <CardTitle className="text-base">
                  This demo uses practice data, not official 2026 guidance
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Source availability checked July 19, 2026.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-sm leading-6">
            <p>
              The verified 2026 source material needed for an official result is not available in
              this experience.
            </p>
            <p className="text-muted-foreground">
              Vidicy does not silently reuse an older year. The built-in numbers and PDFs are
              made-up practice examples and are labeled that way wherever they appear.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  href="https://www.huduser.gov/portal/datasets/mtsp.html"
                  target="_blank"
                  rel="noreferrer"
                >
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
                <Link
                  href="https://www.irs.gov/pub/irs-utl/8823-guide.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  IRS Form 8823 guide <ExternalLinkIcon className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-[var(--shadow-dashboard)]">
          <CardHeader className="border-b border-border/70 bg-muted/20">
            <CardTitle className="text-base">What Vidicy does—and does not do</CardTitle>
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
      </main>
    </>
  );
}

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
