# RealDoor Product Requirements Document

**Status:** Competition product definition  
**Product:** RealDoor Application-Readiness Copilot  
**Scope:** One organizer-selected metro, one LIHTC program, frozen 2026 rules, synthetic documents only  
**Source of truth:** [Challenge statement](./PROBLEM_STATEMENT.md)

## 1. Product decision

Build RealDoor as a guided, evidence-linked workspace that helps a renter produce an accurate and inspectable application-readiness packet. Do not build a general housing chatbot, an eligibility checker, or a property recommender.

The product must make one trust chain visible from end to end:

`document evidence -> renter-confirmed field -> cited rule and deterministic calculation -> checklist state -> renter-controlled packet`

Inputs are correctable and removable; rules and transformations are inspectable and versioned; removing an input invalidates every dependent output. The product reports facts, calculations, missing items, and uncertainty; it never reports an eligibility or acceptance conclusion.

**Competition strategy:** pass every required journey gate before releasing Discover. A polished stretch feature cannot compensate for a failure in the core journey, which accounts for the full judging rubric.

## 2. Product thesis

Most submissions can upload a document and generate an answer. RealDoor should win by making every answer *proof-carrying*.

The renter can always answer five questions:

1. Where did this value come from?
2. Did I confirm it?
3. Which published rule was used?
4. How was this number calculated?
5. What exactly will leave the product if I download the packet?

This creates a coherent experience rather than a collection of AI features. The differentiator is not more automation; it is visible control at every handoff between extraction, rules, math, and preparation.

### User promise

> Know what you have, see what the published rule says, fix what is uncertain, and leave with a packet you control. A qualified human—not RealDoor—makes the decision.

## 3. User, problem, and desired outcome

### Primary user

A renter like Maria who has multiple income sources, limited time, and uncertainty about which documents and published limits apply to an affordable-housing application.

### Job to be done

> When I am preparing to apply to a LIHTC property, help me turn the documents I already have into a clear and accurate packet, understand the relevant published rule, and identify what I still need—without deciding for me or sending anything without my permission.

### Product outcome

The renter finishes one uninterrupted session with:

- a profile containing only values they confirmed;
- a neutral, cited presentation of the confirmed value and published threshold using the correct program, geography, household size, rule year, and effective date;
- a checklist that distinguishes present in session, missing from session, expired per checklist, and unresolved items without producing a score;
- a previewed, editable, downloadable packet; and
- observable confirmation that product-held session data was deleted and the session can no longer be reopened.

## 4. Product principles

1. **Assist, never adjudicate.** RealDoor may extract, explain, calculate, present published facts side by side, and prepare. It may not approve, deny, score, rank, predict acceptance, or label someone eligible.
2. **Confirmation before propagation.** An extracted value cannot affect a calculation, checklist, answer, or packet until the renter confirms or corrects it.
3. **Evidence before fluency.** A concise abstention is better than an uncited or weakly supported answer.
4. **Frozen rules, visible version.** The organizer's 2026 corpus is the only competition authority for rules and thresholds. Program, geography, version, source, and effective date remain visible throughout the journey.
5. **Deterministic math, explained plainly.** AI may explain a calculation but may not invent or perform opaque eligibility reasoning.
6. **Renter control is an action, not a disclaimer.** Preview, edit, include or exclude, download, and delete are first-class controls. Nothing is auto-sent.
7. **Synthetic and minimal by design.** The competition experience uses synthetic documents, extracts only allowlisted fields, keeps content isolated, and never trains on uploads.
8. **Accessibility is part of correctness.** If a renter cannot complete the journey with a keyboard and assistive technology, the journey is incomplete.

## 5. Scope

### Core competition product

- One fixed metro and one fixed LIHTC program context.
- One frozen 2026 rule corpus and gold checklist.
- Synthetic pay stubs and benefit letters from the organizer pack.
- Profile, Understand, and Prepare as one continuous journey.
- Evidence boxes, confidence, correction, downstream propagation, citation, deterministic math, abstention, refusal, prompt-injection resistance, export, and session deletion.
- A user-visible inventory of every field used and why it is used.
- WCAG 2.2 AA across the full journey and exported packet.

### Conditional stretch scope: Discover

- The organizer-provided metro property subset, or a clearly labeled rehearsal subset derived from the current HUD LIHTC file.
- An unfiltered property list and map, renter-selected filters, neutral ordering, and explicit source/freshness labels.
- Availability always shown as unknown unless a separate authoritative source is supplied.

### Current build readiness

| Stage | Local status | Product consequence |
| --- | --- | --- |
| Profile | Organizer synthetic documents, gold fields, and evidence boxes are missing. | Blocked for authoritative evaluation. |
| Understand | Only public FY2025 MTSP references are local; the required frozen 2026 corpus is missing. | The public files may be used for format testing only; never fall back to FY2025 in the challenge demo. |
| Prepare | The organizer checklist and its document-date rules are missing. | Blocked for authoritative evaluation. |
| Discover | The latest downloaded public HUD LIHTC archive is processed locally. | Usable with historical-data and availability caveats; the organizer metro subset is still required for the challenge demo. |

### Explicit non-goals

- Eligibility, approval, denial, readiness, risk, match, or acceptance scores.
- Property recommendations, “best matches,” predicted acceptance, or inferred preferences.
- Multi-program or multi-year coverage.
- Real applicant documents or production tenant screening.
- Application submission, auto-send, provider messaging, or a landlord/agency portal.
- Live vacancy, waitlist, current-rent, or application-status claims.
- Demographic, behavioral, neighborhood, landlord-revenue, or protected-trait features.
- Optional aggregate datasets, market context, and transit overlays in the competition release.

The required short architecture and risk note is a separate competition artifact. This PRD deliberately defines product behavior and acceptance, not system implementation.

## 6. Experience model

### Persistent context

Every screen shows the active metro, program, rule year, effective date, and checklist “as of” date. Any property- or unit-specific rule context appears where it affects a calculation. A persistent **Evidence Trail** lets the renter inspect how a source value feeds a calculation, checklist item, and packet section. **Delete session** remains available from every stage.

### State language

RealDoor keeps provenance, calculation, and checklist states separate:

| Context | States | Meaning |
| --- | --- | --- |
| Profile | Extracted / Needs review / Confirmed | A value is awaiting review, blocked by uncertainty, or explicitly accepted/corrected. |
| Calculation | Calculated / Unresolved | A value was produced from the frozen contract, or a named dependency is missing/conflicting. |
| Checklist | Present in session / Missing from session / Expired per checklist / Unresolved | A confirmed document mapping is present, absent, outside the organizer-defined date window, or not determinable. These labels do not establish authenticity, sufficiency, eligibility, or reviewer acceptance. |

The product may show factual counts of checklist states, but never turns them into a completion percentage, grade, readiness score, traffic light, or “ready/not ready” treatment.

## 7. Core renter journey

### 7.1 Start and consent

The start screen makes the product boundary unmistakable before upload.

**Required experience**

- Identify the fixed program, metro, rule year, corpus version, effective date, checklist “as of” date, and any configured property/unit context required by the frozen rules.
- State that the prototype accepts synthetic documents only and does not decide or submit applications.
- Explain, in plain language, the purpose of extraction, rule lookup, calculation, packet creation, and session activity logging.
- State that the session uses minimal, isolated handling, is never used for training, and can be deleted by the renter on demand.
- Obtain affirmative consent before accepting a document; record the consent event and policy version without recording document contents.
- Remind the renter that the research prototype must be used with synthetic documents and test data only.
- Offer a clear way to enter an allowlisted household fact when it is not present in a document.

**Completion condition:** the renter knows what the product will do, what it will not do, and what data use they are accepting.

### 7.2 Profile — verify the facts

Profile turns organizer-provided synthetic documents into a human-confirmed set of facts.

**Required experience**

- Accept supported synthetic pay-stub and benefit-letter files.
- Extract exactly the organizer-defined allowlist. Protected traits, proxies, and non-allowlisted fields never enter the profile or downstream logic.
- Every field exposes its label, purpose, document, page, source box, extracted value, and calibrated confidence. Confidence is validated against the organizer's gold documents; uncertainty produces **Needs review**.
- Pair the visual evidence box with an equivalent text description so review is not vision-dependent.
- Keep every value unconfirmed by default. Low-confidence, missing-evidence, ambiguous, and conflicting values enter **Needs review** rather than being guessed.
- Let the renter accept, correct, or remove each value. Renter-entered values are labeled as such and never presented as document-derived.
- Require confirmation of every extracted value before reuse. Let the renter correct a proposed document type, relevant date, or checklist mapping before it affects the checklist.
- Editing or removing a confirmed dependency immediately invalidates every dependent calculation, answer, checklist state, and packet section. Stale output cannot be exported. After recomputation, show a short “What changed” notice with the affected outputs, and verify that the prior value is absent from preview and download.
- Log consent, actions, and rule versions without logging raw document contents.

**Critical edge behavior**

- Two documents disagree: show both sources and ask the renter to choose or enter a value; do not reconcile silently.
- Evidence is unreadable: abstain and request review; do not fabricate a value.
- Document text contains instructions: treat them as document content, ignore them as commands, and record a content-free safety event.
- A non-allowlisted field appears: do not extract, log, or reuse it.

**Completion condition:** every value that can influence later stages is confirmed and traceable to a document box or explicit renter entry.

### 7.3 Understand — show the rule and the math

Understand accepts natural-language questions within the organizer-supported rule set and presents a neutral calculation worksheet. It is not an open-domain housing chatbot and does not answer “Am I eligible?”

**Required experience**

- Answer only from the frozen organizer corpus for the configured program and 2026 rule year.
- Use program- or property-specific designations only from a versioned configuration grounded in the authoritative corpus. The renter confirms household facts but is never asked to guess an official band or unit designation. If required context is absent or conflicting, the calculation is **Unresolved**.
- Produce numeric outputs deterministically—not through generated prose. Use the frozen rule set's required inputs, units, lookup context, annualization, rounding, and effective date; missing or conflicting inputs stop the calculation.
- Show, together: the confirmed inputs, annualized or otherwise required arithmetic result, published threshold, formula/intermediate values, source title, pinpoint citation, corpus version, and effective date.
- Let the renter open the cited passage beside the explanation.
- Every citation must open the supporting passage in the frozen corpus; otherwise abstain.
- Distinguish source text, renter-confirmed facts, and deterministic calculations visually and semantically.
- Recalculate after a confirmed correction and identify which output changed; invalidated or stale versions are never actionable.
- If a rule, citation, property-specific designation, or input is missing or conflicting, stop the calculation and show **Unresolved** with the exact missing dependency.
- Keep source language intact where necessary, but never convert it into a product verdict.

**Decision boundary:** RealDoor may show the confirmed value, published threshold, formula, and neutral arithmetic comparison. It may not turn that comparison into a pass/fail treatment, eligibility label, acceptance prediction, score, or recommendation.

**Decision-boundary response**

For “Am I eligible?” or “Will this property accept me?”, RealDoor responds with the applicable confirmed value, published threshold, formula, and citation, followed by: **“RealDoor does not determine eligibility or acceptance. A qualified human reviewer makes that decision.”**

It must not use green/red pass-fail styling or phrases such as “you qualify,” “likely eligible,” “good chance,” or “not a fit.”

**Completion condition:** the renter can reproduce the arithmetic and open the exact authoritative passage, while no screen states or implies a decision.

### 7.4 Prepare — control the packet

Prepare compares the session against the organizer's gold checklist and produces the renter-controlled artifact.

**Required experience**

- Show each checklist requirement, its source, and one of four session facts: Present in session, Missing from session, Expired per checklist, or Unresolved.
- The document type, relevant date, and checklist mapping are visible and correctable. **Present in session** does not mean a reviewer will accept the document.
- Explain an expiration flag with the confirmed document date, frozen organizer “as of” date/timezone, rule, and arithmetic. Do not infer expiration from document appearance.
- Provide direct paths from a checklist item back to its supporting evidence and from an unresolved item to the missing input.
- Let the renter edit confirmed values, remove fields or documents, and choose which optional evidence and source documents appear in the packet.
- Show a complete packet preview before download and require an explicit download action.
- Never auto-send or submit the profile or packet. The competition flow ends with a renter-initiated download.
- Keep **Delete session** available before and after download through an accessible review/confirm/cancel flow. Make clear that deletion removes product-held session data, while an already downloaded copy remains under the renter's control.

**Packet contents**

| Status | Contents |
| --- | --- |
| Always included | Purpose and decision-boundary cover; renter-selected confirmed profile fields with source labels; income worksheet with citations, rule version, and effective date; checklist states; generation timestamp. |
| Renter-selected | Evidence index, synthetic source documents, and unresolved questions for a qualified reviewer. |

The preview and downloaded packet must contain the same selected content. The packet must use structured headings, meaningful reading order, selectable text, non-color status labels, and text alternatives for visual evidence references.

**Completion condition:** the renter can account for every packet item, revise it, download it intentionally, and delete the session.

## 8. Cross-cutting trust requirements

### 8.1 Evidence Trail

The Evidence Trail is the product's signature experience. Selecting any calculated or checklist value reveals:

- the source document and page or “renter entered” label;
- the original evidence box and extracted confidence, when applicable;
- the renter confirmation or correction action;
- every deterministic transformation;
- the exact rule passage, version, and effective date; and
- every downstream place where the value appears.

No unlisted input or derivation may influence an answer, checklist state, Discover behavior, or packet. A **Data we use** view publishes every field used by the product, its purpose, and where it affects the journey.

### 8.2 Safety and privacy

- Uploaded documents and extracted text are untrusted data, never instructions. They cannot change the field allowlist, organizer configuration, rules corpus, citations, tools, or access boundaries.
- Rule answers use only the frozen corpus. Every displayed citation resolves to that corpus; silence or conflict produces **Unresolved**.
- Sessions are isolated and use minimal retention. Any persisted session content is encrypted.
- Uploads and session data are never used for training, screening, profiling, property ordering, or ranking.
- No protected trait or behavioral proxy may be inferred or used.
- On-demand deletion removes product-held uploads, extracted data, confirmed values, calculations, checklist state, previews, packet artifacts, and session-linked consent/action/rule-version logs so the session cannot be reopened. No session-linked log survives deletion.
- Product outputs never approve, deny, score, rank, or predict eligibility or acceptance.

### 8.3 Accessibility and comprehension

The complete path—consent, upload, evidence review, correction, rule question, calculation, checklist, preview, download, and deletion—must work with keyboard alone and with a screen reader.

Required product outcomes:

- visible, unobscured focus and no keyboard traps;
- programmatic names, roles, labels, instructions, and errors;
- headings and reading order that match the visual hierarchy;
- status conveyed through text and structure, never color alone;
- upload, extraction, correction, recalculation, export, and deletion completion announcements;
- no drag-only action and sufficiently large pointer targets;
- reflow and zoom without losing evidence, citations, or controls;
- plain-language explanations with expandable source detail; and
- an accessible downloaded packet, not an image-only export.

The complete journey must meet WCAG 2.2 AA. Deletion requires an accessible review and explicit confirmation, and the downloaded packet must remain readable with assistive technology rather than becoming an image-only export.

## 9. Discover — gated stretch experience

Discover is a transparent browser for public property records, not a recommendation engine.

### Product behavior

- Enter on **All records in this snapshot**, showing the configured metro-subset total and a neutral A–Z order.
- Show every record in the unfiltered snapshot. Records without usable coordinates remain in the list and are identified as unavailable on the map rather than silently removed.
- Let the renter apply only visible, reversible filters they choose, such as historically reported city or bedroom-count fields. Always show active filters, before/after counts, and **Reset to all records**.
- Label each item **Historical HUD property record** with the exact snapshot vintage. State that current address, program participation, unit mix, rents, applications, and property status are unverified.
- Display **Availability unknown** on every record. No separate authoritative availability source is present in the competition data.
- Do not infer current rent, open waitlists, acceptance criteria, neighborhood quality, protected traits, or renter-property fit.
- Do not show recommendations, sponsored ordering, match percentages, “top” properties, or personalized ranking. A map pin or list position carries no evaluative meaning.

### Release condition

Discover is demoed only after the entire core acceptance suite passes. If the organizer metro subset is unavailable, Discover remains a clearly labeled rehearsal using public data and is not represented as the challenge-authoritative subset.

## 10. Data readiness and authority

### Local data assessment as of 2026-07-19

| Asset | Finding | Product decision |
| --- | --- | --- |
| Organizer 2026 pack | Not present locally: frozen 2026 MTSP corpus, selected metro subset, synthetic documents, gold fields/boxes, checklist, Q&A, adversarial tests, and license manifest are missing. | **Core launch blocker.** Do not substitute public FY2025 rules or invent gold expectations. |
| Public FY2025 MTSP tables | Both workbooks contain 4,764 unique geography rows, but they are the wrong rule year. | Format rehearsal only. Never present as the required 2026 authority. |
| Current public HUD LIHTC property file | 55,345 unique HUD project records; 95.93% have coordinate pairs. Missing fields and unknown/unconfirmed source codes remain. | Suitable for Discover rehearsal with visible missing-data and historical-record labels; unsuitable for current-property or applicant claims. Detailed profiling remains in [`data/README.md`](./data/README.md). |
| Legacy 2017 LIHTC archive | Historical archive from a retired URL. | Keep isolated; never use in product output. |

### Data rules

- The organizer's metro/program definition, frozen 2026 corpus, effective dates, calculation rules, field allowlist, and checklist are the competition authority and must be complete before the authoritative demo.
- If the program, year, geography, threshold, effective date, or citation cannot be verified from that corpus, RealDoor abstains.
- Use the source's unique HUD project identifier to keep historical property records distinct.
- Missing coordinates, dates, unit counts, or addresses are visible data states—not reasons to silently suppress a property.
- The public LIHTC file is a project-location dataset. It is never joined to applicant data for prediction, profiling, or ranking.

## 11. Competition release gates

| Rubric area | What judges must see | Release gate |
| --- | --- | --- |
| Profile accuracy — 25% | Correct allowlisted values, source boxes, calibrated confidence, abstention, correction, and atomic propagation. | Test against every organizer gold document. Uncertain values enter Needs review, no unconfirmed value propagates, and every confirmed correction updates all dependent outputs. |
| Rules and math — 25% | Correct configured context, pinpoint citation, visible formula, exact arithmetic, and effective date. | Supported gold Q&A and calculations are exact; every citation opens the frozen passage; every unsupported or incomplete case identifies the missing dependency and abstains. |
| Safety and privacy — 20% | Useful refusal, ignored document injection, minimal session data, intentional export, and deletion. | The adversarial suite produces no decision, score, ranking, protected-trait inference, data exposure, or acceptance prediction. Deletion makes the session unavailable and removes its product-held content. |
| Accessibility — 15% | Keyboard-complete journey, clear focus, labeled evidence/errors/status, announcements, readable citations, accessible deletion, and readable export. | Pass WCAG 2.2 AA checks for the full journey in Section 8.3 using keyboard and screen-reader testing. |
| End-to-end usefulness — 15% | One coherent journey ending in a clear, editable, renter-controlled packet. | The golden scenario completes without a dead end or facilitator repair. The corrected value is absent from the preview/download, which match each other and expose unresolved items. |

The gating order is: **truth chain -> safety/privacy/accessibility -> judge-path polish -> Discover**. A later gate cannot compensate for failure in an earlier one.

### North-star acceptance statement

> A renter can produce a fully inspectable packet without any unconfirmed value being reused, any unsupported rule being presented, any eligibility conclusion being made, or any content leaving without an explicit action.

## 12. Judge-facing golden scenario

Define one golden household scenario using the organizer-provided synthetic documents and gold materials. Select inputs that let the demo show multiple income sources, uncertainty or correction, a missing or expired item, supported and unsupported rules questions, and an adversarial document instruction.

The demo follows this exact story:

1. Start a synthetic-document session, accept the specific data uses, and briefly open **Data we use** to prove the feature inventory is visible.
2. Upload both the organizer pay stub and benefit letter; inspect an extracted value, calibrated confidence band, and source box.
3. Show an ambiguous value blocked from propagation. Resolve it, then correct one extracted value and use the Evidence Trail to show atomic downstream updates and invalidation of the old value.
4. Ask an unsupported question and show **Unresolved**; then ask the gold question and open its authoritative passage, corpus version, and effective date.
5. Show the deterministic worksheet with the configured context, formula, arithmetic, threshold, and effective date. Point out that the neutral comparison produces no eligibility verdict.
6. Complete the correction-to-download path by keyboard. Trace the missing or expired item to its checklist rule and frozen “as of” date, choose packet contents, preview, download, open the downloaded artifact, and show the “Downloaded to you; not sent” confirmation plus one screen-reader status announcement.
7. Ask RealDoor to decide eligibility or predict acceptance; show the useful refusal with cited facts.
8. Run the embedded-instruction test; show that document text cannot change product behavior, tools, rules, or data access.
9. Delete the session through the review/confirm flow; verify that the session and prior preview route cannot reopen while the local download remains renter-controlled.

Every transition makes a rubric requirement visible. Safety, accessibility, correction, abstention, citation, and deletion are normal product behavior, not slides or claims. Discover is an optional coda only after the core evidence is complete and time remains.

## 13. Principal risks and product responses

| Risk | Product response |
| --- | --- |
| The required organizer pack arrives late or differs from public formats. | Treat the pack as configuration and the only authority; block authoritative rule output until its version, effective date, and gold expectations are verified. |
| A fluent answer is mistaken for an eligibility decision. | Use the fixed neutral worksheet, decision-boundary copy, non-evaluative styling, and prohibited-language test suite. |
| A wrong extraction appears confident. | Calibrate against gold documents, keep values unconfirmed by default, expose the evidence box, and favor Needs review over false confidence. |
| Generic MTSP limits omit a property- or unit-specific condition. | Use a versioned team configuration grounded in the authoritative corpus; show any missing designation as Unresolved and direct the renter to a qualified reviewer. |
| A renter assumes the packet was submitted. | State “Downloaded to you; not sent” at preview and completion. Nothing is sent without an explicit renter action. |
| Public property records look like live listings. | Use “Historical HUD property record,” source vintage, and “Availability unknown” on every record; do not show unsupported rent, waitlist, or contact claims. |
| Missing map data silently narrows Discover. | Keep coordinate-less records in the list and account for them in the total. |
| Deletion is interpreted as deleting a local download. | Explain the boundary before deletion: product-held data is removed; files already downloaded remain under renter control. |

## 14. Required organizer inputs

These are the inputs promised by the challenge statement:

1. Selected metro LIHTC subset and data dictionary.
2. Frozen 2026 MTSP limits and official rule corpus, including version and effective date.
3. Synthetic documents with gold fields and source boxes.
4. Gold checklist, Q&A, and adversarial tests.
5. Current data, model, and code license manifest.

The team owns the golden scenario, confidence-evaluation protocol, calculation examples, and packet design. The authoritative demo is not ready until the five promised organizer inputs are received and reconciled.

## 15. Sources

- [RealDoor challenge statement](./PROBLEM_STATEMENT.md)
- [HUD Multifamily Tax Subsidy Project income limits](https://www.huduser.gov/portal/datasets/mtsp.html)
- [HUD LIHTC property-level data and documented missing-data caveat](https://www.huduser.gov/portal/datasets/lihtc/property.html)
- [IRS Section 42 average-income-test regulations](https://www.irs.gov/irb/2022-44_IRB)
- [W3C Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)
- Local provenance and limitations: [`data/README.md`](./data/README.md) and [`data/manifests/sources.md`](./data/manifests/sources.md)
