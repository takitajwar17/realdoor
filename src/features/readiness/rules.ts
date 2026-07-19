import type { RulePack, SourceCitation } from "./domain";

const RULE_SOURCES = [
  {
    id: "rehearsal-checklist-method",
    title: "RealDoor practice document checklist",
    url: "/dashboard/data-we-use",
    passage:
      "For this practice journey only, a pay statement uses a 120-day window, a benefits letter uses a 365-day window, and a bank statement uses a 90-day window. These are made-up practice settings, not a property's requirements.",
  },
  {
    id: "rehearsal-calculation-method",
    title: "RealDoor practice calculation method",
    url: "/dashboard/data-we-use",
    passage:
      "The practice calculation adds renter-confirmed monthly income sources and multiplies the total by 12. It never treats the result as an eligibility decision.",
  },
  {
    id: "hud-mtsp-source",
    title: "HUD Multifamily Tax Subsidy Project income limits",
    url: "https://www.huduser.gov/portal/datasets/mtsp.html",
    passage:
      "HUD publishes household-size MTSP income limits for Low-Income Housing Tax Credit properties and says the official tables should be used for official purposes.",
  },
  {
    id: "hud-2026-release-statement",
    title: "HUD statement on FY 2026 income limits",
    url: "https://www.huduser.gov/portal/datasets/il/il26/Statement-on-FY-2026-Income-Limits.pdf",
    passage:
      "HUD announced that FY 2026 median family income estimates and income limits were delayed from April 1, 2026 to May 1, 2026 after a Census data delay.",
  },
  {
    id: "irs-section-42-guide",
    title: "IRS Guide for Completing Form 8823",
    url: "https://www.irs.gov/pub/irs-utl/8823-guide.pdf",
    passage:
      "LIHTC tenant files commonly use income certifications and supporting verification. Property owners and allocating agencies remain responsible for compliance decisions.",
  },
  {
    id: "rehearsal-data-practice",
    title: "RealDoor session data practice",
    url: "/dashboard/data-we-use",
    passage:
      "Documents stay within the renter's private session, are never sent automatically, and can be removed by deleting the session.",
  },
] as const satisfies readonly SourceCitation[];

export const SYNTHETIC_2026_RULE_PACK: RulePack = {
  id: "boston-lihtc-2026-synthetic-rehearsal-v1",
  label: "Boston LIHTC 2026 practice guide",
  program: "LIHTC · 60% AMI practice comparison",
  metro: "Boston-Cambridge-Quincy, MA-NH HUD Metro FMR Area",
  year: 2026,
  effectiveDate: "2026-07-19",
  version: "2026.07 practice edition",
  authority: "synthetic-rehearsal",
  // Deliberately synthetic values for interaction rehearsal. These are not copied
  // from FY2025 and must never be represented as organizer or official limits.
  incomeLimits60Percent: {
    1: 66_000,
    2: 75_400,
    3: 84_800,
    4: 94_200,
    5: 101_750,
    6: 109_300,
    7: 116_850,
    8: 124_400,
  },
  calculationSourceIds: [
    "rehearsal-calculation-method",
    "hud-mtsp-source",
    "hud-2026-release-statement",
  ],
  checklistRequirements: [
    {
      id: "pay-stub",
      label: "Recent pay statement",
      kind: "pay_stub",
      maxAgeDays: 120,
      sourceId: "rehearsal-checklist-method",
    },
    {
      id: "benefits-letter",
      label: "Benefits verification letter",
      kind: "benefits_letter",
      maxAgeDays: 365,
      sourceId: "rehearsal-checklist-method",
    },
    {
      id: "photo-id",
      label: "Photo identification",
      kind: "photo_id",
      maxAgeDays: null,
      sourceId: "rehearsal-checklist-method",
    },
    {
      id: "bank-statement",
      label: "Recent bank statement",
      kind: "bank_statement",
      maxAgeDays: 90,
      sourceId: "rehearsal-checklist-method",
    },
  ],
  sources: RULE_SOURCES.map((source) => ({ ...source })),
};

export function getRuleSource(id: string) {
  return RULE_SOURCES.find((source) => source.id === id);
}

export type RuleAnswer = {
  status: "answered" | "unresolved";
  answer: string;
  sourceIds: string[];
};

const prohibitedDecisionPattern =
  /\b(eligible|eligibility|qualif(?:y|ied|ication)|approv(?:e|al|ed)|deny|denial|rank|score|predict)\b/iu;
const instructionAttackPattern =
  /\b(ignore (?:all |the )?(?:previous|prior) instructions|system prompt|reveal .{0,20}(?:prompt|secret)|upload (?:all|every))\b/iu;

export function answerRuleQuestion(rawQuestion: string): RuleAnswer {
  const question = rawQuestion.trim().toLocaleLowerCase("en-US");

  if (prohibitedDecisionPattern.test(question)) {
    return {
      status: "unresolved",
      answer:
        "RealDoor cannot determine eligibility, approval, denial, qualification, rank, or score. It can only organize facts you confirm and show the cited arithmetic.",
      sourceIds: [],
    };
  }

  if (instructionAttackPattern.test(question)) {
    return {
      status: "unresolved",
      answer:
        "That request is outside the saved practice guide. Instructions inside questions or documents cannot change how RealDoor handles data.",
      sourceIds: [],
    };
  }

  if (/\b(annual|annualiz|monthly|times 12|× 12)\b/iu.test(question)) {
    return {
      status: "answered",
      answer:
        "For this practice session, confirmed monthly employment, benefits, and other income are added, then multiplied by 12. The arithmetic is shown line by line and is not an eligibility decision.",
      sourceIds: ["rehearsal-calculation-method"],
    };
  }

  if (/\b(60%|60 percent|threshold|income limit|ami|mtsp)\b/iu.test(question)) {
    return {
      status: "answered",
      answer:
        "This practice journey compares confirmed annual income with a made-up household-size 60% AMI value. Official 2026 materials are not available in this demo; use official HUD MTSP tables for official purposes.",
      sourceIds: ["hud-mtsp-source", "hud-2026-release-statement"],
    };
  }

  if (/\b(document|pay stub|benefit|verification|120 day|fresh|expired)\b/iu.test(question)) {
    return {
      status: "answered",
      answer:
        "The practice checklist looks for recent income verification and keeps an item unresolved when its date or meaning is unclear. The property or its housing agency—not RealDoor—decides what its application requires.",
      sourceIds: ["rehearsal-checklist-method", "irs-section-42-guide"],
    };
  }

  if (/\b(send|share|delete|privacy|store|session|packet)\b/iu.test(question)) {
    return {
      status: "answered",
      answer:
        "Nothing is sent automatically. You choose what appears in the packet, download it yourself, and can delete the session to remove its linked content from the app.",
      sourceIds: ["rehearsal-data-practice"],
    };
  }

  return {
    status: "unresolved",
    answer:
      "The saved practice guide does not contain enough information to answer that safely. Check an official source or ask the property for its application-specific requirement.",
    sourceIds: [],
  };
}
