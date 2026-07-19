# RealDoor Data

## Organizer challenge data

The organizer-provided v1 starter pack is normalized under `organizer/v1/`. Its original ZIP
and original contents checksum manifest are preserved unchanged under `organizer/source/`.
The pack is the challenge source for the frozen 2026 MTSP corpus, synthetic household
documents, gold extraction fields and source boxes, checklists, Q&A, and adversarial tests.

```text
data/organizer/
├── source/             # immutable organizer ZIP and original checksums
└── v1/                 # normalized, ready-to-use pack
    ├── data/
    ├── evaluation/
    ├── governance/
    ├── participant-guide/
    ├── rules/
    ├── starter/
    └── synthetic_documents/
```

The normalized copy excludes generated Python bytecode and one redundant copy of the gold
document schema. The canonical schema is
`organizer/v1/synthetic_documents/gold/field_schema.json`; the original pack remains fully
recoverable from the source ZIP. See `manifests/organizer-v1-quality.md` for validation and
overlap findings.

## Public reference data

- `raw/hud/mtsp/`: Public FY 2025 MTSP limits, income-averaging limits, and methodology.
  These are reference files only and must not be presented as the required 2026 corpus.
- `raw/hud/lihtc/lihtcpub.zip`: Current HUD LIHTC property archive downloaded from HUD's
  live database endpoint. It contains the 2024 data dictionary and property workbooks.
- `raw/hud/lihtc/LIHTCPUB-legacy-2017.zip`: Historical archive returned by HUD's retired
  download URL. Do not use it in the application.

## Extracted and processed data

- `extracted/hud/lihtc/current/`: Complete contents of the current HUD archive, including
  Access and Excel representations and the 2024 data dictionary.
- `extracted/hud/lihtc/legacy-2017/`: Extracted historical archive, isolated from current data.
- `processed/discover/lihtc-properties-data.csv`: Application-ready Discover dataset with
  55,345 property records and 80 columns. This was exported from the current HUD workbook.

The manually downloaded archives and workbooks remain unchanged under `raw/` and `extracted/`.
They are intentionally isolated from the organizer pack so source provenance is never lost.

Do not use LIHTC property records as evidence of vacancies, open waitlists, current rents,
or applicant acceptance. Do not use any public dataset to infer protected traits or rank
renters or properties.

## Quick quality profile

Profiled on 2026-07-19 at one row per HUD project record:

| Check | Result | Product implication |
| --- | ---: | --- |
| Rows / columns | 55,345 / 80 | National reference source; use the organizer subset for challenge flows. |
| Missing or duplicate `hud_id` | 0 / 0 | Use `hud_id` as the record identity. |
| Exact duplicate rows | 0 | No exact-row deduplication is needed. |
| Missing street address | 1.42% | Show an explicit missing-address state. |
| Missing city | 0.08% | Do not silently remove the record from list results. |
| Missing ZIP | 5.43% | ZIP filtering cannot cover every record. |
| Missing coordinate pair | 4.07% | Keep these records in the list and disclose that they cannot be mapped. |
| Missing source-repaired unit fields | 0.20% | Label unit facts as HUD-reported and allow an unknown state. |
| Unknown/unconfirmed placed-in-service codes (`8888`/`9999`) | 5.00% | Do not treat placed-in-service year as current operating status. |
| Repeated normalized name/address identity | 0.41% of rows | Do not merge by name/address; phased or resyndicated records may be distinct. |

The exact project-city labels contain 35 Cambridge and 164 Boston records. These are useful
for interface rehearsal only; they do not define a metropolitan boundary and exclude records
stored under neighboring cities or neighborhood labels.

The two public FY 2025 MTSP workbooks each contain 4,764 unique geography rows across 56
state/territory codes. Their structure is usable for format rehearsal, but their year makes them
non-authoritative for the challenge's required 2026 calculations.
