# Data Quality Report

Validated on 2026-07-19 after centralizing the manually downloaded and supplied datasets.

## Integrity and uniqueness

| Check | Result |
| --- | --- |
| Source ZIP SHA-256 | `6deeddccce34a099323da5322f63328bf91894c10176821d5b157ed9d82f6468` |
| Embedded source checksums | All entries passed before normalization |
| Canonical property rows / duplicate or blank `hud_id` | 55,346 / 0 / 0 |
| Property source composition | 55,314 HUD-only / 31 merged / 1 supplied-only |
| 2026 MTSP rows / duplicate `household_size` | 8 / 0 |
| Document manifest rows / duplicate `document_id` | 24 / 0 |
| Document-gold rows / duplicate `document_id` | 24 / 0 |
| Rule rows / duplicate `rule_id` | 11 / 0 |
| Gold Q&A rows / duplicate `qa_id` | 36 / 0 |
| Adversarial rows / duplicate `test_id` | 24 / 0 |
| Missing PDFs referenced by the document manifest | 0 |
| References to missing rule IDs | 0 |
| Exact duplicate files outside immutable archives | 0 groups |
| Supplied starter tests before code removal | 8 passed / 0 failed |

## Merge behavior

The two property inputs shared 31 `hud_id` values. They agreed on normalized property name
and address identity. These are now single rows in `processed/lihtc-properties.csv`. Nonblank
values from the supplied challenge subset take precedence; blank supplied values do not erase
available national values. This preserves the reported unit counts for `MAB20151006`.

The previously absent `MAB20200006` is included as the only supplied-only property. Each row
records whether it came from `hud_current`, `realdoor_starter_v1`, or both.

## Removed redundancy

- The separate supplied subset was removed after the keyed merge.
- Repeated CSV sheets and the workbook container were not copied into processed data. The
  workbook's unique `Scenario Gold` sheet was preserved as `processed/gold/scenario-gold.csv`.
- One exact duplicate schema, generated Python caches, supplied starter code/tests, and the
  alternate DOCX guide were removed from the working tree. They remain recoverable from the
  immutable source ZIP.
- Source archives stay under `raw/` for reproducibility and are never treated as application
  inputs.

## Product cautions

Missing address, ZIP, coordinate, and unit fields remain legitimate unknowns in the national
source. The interface must display unknown states rather than dropping records or inventing
values. LIHTC records do not prove vacancies, open waitlists, rent amounts, or acceptance.
