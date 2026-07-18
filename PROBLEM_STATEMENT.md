# Challenge 03: RealDoor Application-Readiness Copilot

> In collaboration with MIT Club of Northern California and MIT Club of Germany  
> Powered by RealPage

Build a renter-side copilot that turns synthetic household documents into a human-confirmed profile, explains one affordable-housing program's rules with citations, identifies missing or expired documents, and creates a renter-controlled application-readiness packet - without deciding eligibility.

## Why This Matters

Maria works two jobs and is trying to move her family into affordable housing. Listings and requirements are fragmented, programs ask for different paperwork, and a small error can delay an application for weeks.

The opportunity is not to automate the decision. It is to reduce avoidable friction: understand the documents Maria already has, make the published rules legible, surface uncertainty, and help her prepare a packet that a qualified human can review.

### Design Principle

The AI extracts, explains, retrieves, calculates, and prepares. The renter confirms. A qualified human decides.

| Principle | Meaning |
| --- | --- |
| One metro | Keep the context local |
| One program | Freeze the rules |
| Synthetic docs | Protect real renters |
| Human decision | No gatekeeping |

## Required Build

### A Three-Stage Application-Readiness Flow

Build one working journey end to end. Depth, correctness, and renter control matter more than broad geographic or program coverage.

### 1. Profile - Human-Confirmed Extraction

- Upload synthetic pay stubs or benefit letters.
- Extract only allowlisted fields with source boxes and confidence.
- Require confirmation or correction before reuse.

### 2. Understand - Cited Rules and Deterministic Math

- Use a versioned corpus for one program and rule year.
- Show the confirmed value, threshold, formula, source, and effective date.
- Abstain when the rule or input is uncertain; never label the renter eligible.

### 3. Prepare - Renter-Controlled Packet

- Flag missing or expired items against a gold checklist.
- Let the renter preview, edit, download, and delete.
- Never auto-send a profile or packet to a property or provider.

## Required Acceptance Demo

1. Upload a synthetic document and show extracted evidence.
2. Correct one field and show that downstream values update.
3. Ask a rules question and show the authoritative citation.
4. Show the deterministic calculation and its effective date.
5. Identify a missing or expired item, then export the packet.
6. Run the refusal, prompt-injection, and session-deletion tests.

## Stretch Goal - Discover

If time permits, add transparent property discovery using public location data.

- Label availability as unknown unless separately supplied.
- Show the unfiltered set.
- Use renter-selected filters only.
- Never predict acceptance or rank by protected traits or proxies.

## Non-Negotiable Requirements

Responsible AI is part of the product. Teams must demonstrate these controls live. A disclaimer without working controls does not satisfy the challenge.

### No Decisioning

Never approve, deny, score, rank, or determine eligibility. Deflect "decide for me" requests to the rule, confirmed input, and calculation.

### No Hidden Proxies

Do not infer protected traits or use demographic, behavioral, or landlord-revenue features. Publish every feature and its purpose.

### Consent and Correction

Explain each data use; make every extracted value correctable; log consent, actions, and rule versions - not raw document contents.

### Privacy and Security

Use synthetic documents, field allowlists, isolated or ephemeral processing, encryption for persisted data, export, and session deletion. Never train on uploads.

### Untrusted Input

Treat document text as untrusted. Embedded instructions must not alter system behavior, tools, rules, or data access.

### Accessible Journey

Target WCAG 2.2 AA:

- Keyboard operation
- Visible focus
- Labeled controls and errors
- No color-only status
- Structured headings
- Clear completion announcements

## Data and Organizer Pack

> **Research prototype:** RealDoor is assistive, not adjudicative. It must never approve, deny, score, rank, or determine eligibility. Public datasets must not be used to profile applicants or infer protected traits.

### Freeze the Hard Parts Before the Clock Starts

The organizer pack should remove data wrangling that does not differentiate teams. Teams should spend the event building and testing the renter journey.

| Organizers provide | Teams deliver |
| --- | --- |
| One metro LIHTC property subset and data dictionary | Working Profile -> Understand -> Prepare flow |
| Frozen 2026 MTSP limits plus official rule corpus | Recorded sources, effective dates, and deterministic calculations |
| 20-40 synthetic documents with gold fields and source boxes | Field correction, uncertainty, abstention, and deletion |
| Gold checklists, Q&A, adversarial tests, and starter repo | Renter-previewed downloadable packet |
| A current data, model, and code license manifest | A short architecture and risk note |

## Core Public Sources

| Source | Use and limit |
| --- | --- |
| HUD MTSP Income Limits | Required. Use the official 2026 tables and preserve the effective date; LIHTC uses MTSP limits. |
| HUD LIHTC Database | Use only if Discover is attempted. It contains project locations, not vacancies, open waitlists, or current rents. |
| HUD Fair Market Rents | Optional market context only. FMRs are not live asking rents, application criteria, or availability. |

## Optional Expansion Pack - Aggregate Context Only

| Source | Use and limit |
| --- | --- |
| HUD CHAS | Housing need and cost burden for pilot selection. |
| HUD Subsidized Households | Program and assisted-housing context; not vacancies. |
| DOE LEAD | Tract-level energy burden and renter-wellness context. |
| Eviction Lab | Aggregate filing context; never applicant screening. |
| CDC PLACES | Modeled community context; never profiles or rankings. |
| OpenFEMA | Neutral risk facts; never silently suppress properties. |
| Cambridge Open Data | Local housing context for the MIT demo. |
| MBTA V3 API | Optional renter-selected transit and accessibility context. |

## Judging Rubric

| Criterion | Weight | What judges should see |
| --- | ---: | --- |
| Profile accuracy | 25% | Field-level correctness, evidence boxes, calibrated confidence, correction, and abstention. |
| Rules and math | 25% | Right program and year, authoritative citations, exact calculations, and effective dates. |
| Safety and privacy | 20% | Refusal, no scores or inferences, prompt-injection resistance, minimal retention, export, and deletion. |
| Accessibility | 15% | Keyboard-complete journey, understandable errors and status, readable source presentation. |
| End-to-end usefulness | 15% | A coherent journey that produces a clear, editable, renter-controlled packet. |

> **Minimum bar:** A submission that approves, denies, scores, ranks, silently suppresses options, or exposes sensitive data cannot win regardless of model quality.

---

*Hack-Nation x MIT Club of Northern California x MIT Club of Germany - 6th Global AI Hackathon*
