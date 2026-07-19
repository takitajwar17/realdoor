# Organizer v1 Data Quality Report

Validated on 2026-07-19 after extracting
`organizer/source/RealDoor_Hackathon_Starter_Pack_v1.zip` into `organizer/v1/`.

## Integrity and uniqueness

| Check | Result |
| --- | --- |
| Original archive SHA-256 | `6deeddccce34a099323da5322f63328bf91894c10176821d5b157ed9d82f6468` |
| Original embedded checksums | All entries passed before normalization |
| Exact duplicate files in normalized and manual non-archive data | 0 groups |
| Organizer LIHTC rows / duplicate `hud_id` | 32 / 0 |
| 2026 MTSP rows / duplicate `household_size` | 8 / 0 |
| Synthetic document manifest rows / duplicate `document_id` | 24 / 0 |
| Gold document rows / duplicate `document_id` | 24 / 0 |
| Rule rows / duplicate `rule_id` | 11 / 0 |
| Gold Q&A rows / duplicate `qa_id` | 36 / 0 |
| Adversarial rows / duplicate `test_id` | 24 / 0 |
| Missing PDFs referenced by the document manifest | 0 |
| References to missing rule IDs | 0 |
| Organizer starter tests | 8 passed, 0 failed |

## Normalization decisions

- Generated `__pycache__` directories were not copied into the working corpus.
- `starter/schemas/document_gold.schema.json` was an exact duplicate of
  `synthetic_documents/gold/field_schema.json`, so only the latter canonical copy is present.
- The Excel workbook is retained. Several sheets mirror supplied CSV files, but its
  `Scenario Gold` sheet contains information not present in those CSVs.
- The original ZIP is unchanged, so every organizer-provided byte remains recoverable.

## Cross-source overlap

The organizer subset and the manually downloaded national HUD dataset share 31 `hud_id`
values. All 31 agree on normalized property name and address identity. The organizer-only ID
is `MAB20200006`. One shared property, `MAB20151006`, has blank unit counts in the organizer
subset and reported unit counts in the later manual snapshot.

This overlap is intentional and is not removed: one dataset is the organizer's frozen
challenge subset and the other is a separately retrieved national reference snapshot. Keep
them source-scoped. If a combined view is ever required, deduplicate on `hud_id` and retain
source and retrieval-date fields; for challenge behavior, prefer the organizer record.
