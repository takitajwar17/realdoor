# RealDoor Data

The usable corpus is centralized under `processed/`. Files are organized by product purpose,
not by who supplied them.

```text
data/
├── processed/
│   ├── lihtc-properties.csv
│   ├── lihtc-property-data-dictionary.csv
│   ├── mtsp-limits-2026.csv
│   ├── rules.jsonl
│   ├── documents/
│   ├── evaluation/
│   └── gold/
├── raw/
│   ├── hud/
│   └── realdoor/
├── extracted/hud/
└── manifests/
```

## Canonical data

- `processed/lihtc-properties.csv` is the single property table: 55,346 unique HUD projects
  across 87 columns. It combines the national HUD snapshot with the supplied Boston-area
  records using `hud_id` as the key.
- `processed/mtsp-limits-2026.csv` is the frozen 2026 income-limit table used by product
  calculations. The manually downloaded FY 2025 workbooks remain reference-only under
  `raw/hud/mtsp/`.
- `processed/rules.jsonl`, `processed/evaluation/`, `processed/documents/`, and
  `processed/gold/` form one connected evaluation corpus.

For the 31 property IDs present in both inputs, nonblank supplied values take precedence and
otherwise the national record is retained. `record_sources`, `source_retrieved_utc`, and
related source fields make that merge inspectable. The supplied subset contributes one new
property, `MAB20200006`. There are no duplicate `hud_id` values after the merge.

The immutable input archives remain under `raw/`; they are provenance records, not competing
working datasets. Extra starter code, duplicate schemas, generated caches, duplicated workbook
sheets, and alternate document formats are not copied into the processed corpus.

## Safety boundaries

Do not use LIHTC property records as evidence of vacancies, open waitlists, current rents, or
applicant acceptance. Do not use any dataset to infer protected traits or rank renters or
properties. Challenge conventions are recorded as rule passages in `processed/rules.jsonl`
with no separate in-repo source documents.

See `manifests/sources.md` for provenance and `manifests/data-quality.md` for validation.
