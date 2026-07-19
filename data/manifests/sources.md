# Data Source Manifest

Downloaded through Brave Nightly from official HUD endpoints on 2026-07-19.

| Local file | Official source | SHA-256 | Status |
| --- | --- | --- | --- |
| `raw/hud/mtsp/MTSP-Data-FY25.xlsx` | `https://www.huduser.gov/portal/datasets/mtsp/mtsp25/MTSP-Data-FY25.xlsx` | `25dc663874f87311c1940da3ec73d451c01223e3b3b622a1dfd0fe6ba36705e3` | FY 2025 reference only |
| `raw/hud/mtsp/MTSP-IncAvg-Data-FY25.xlsx` | `https://www.huduser.gov/portal/datasets/mtsp/mtsp25/MTSP-IncAvg-Data-FY25.xlsx` | `5122c2575636a2d28df11eeb482379392510e5d40c2518ba418f3ba0f4ebd07e` | FY 2025 reference only |
| `raw/hud/mtsp/MTSP-Briefing-25.pdf` | `https://www.huduser.gov/portal/datasets/mtsp/mtsp25/MTSP-Briefing-25.pdf` | `7c44fe032028532b611596799a21c54ef6395afde9a5080fdba15613f295490b` | FY 2025 methodology |
| `raw/hud/lihtc/lihtcpub.zip` | `https://www.huduser.gov/lihtc/lihtcpub.zip` | `e07acee706174b276f89596d614ac5699efa9848659e5834fdfb5198fa0a7288` | Current property archive |
| `raw/hud/lihtc/LIHTCPUB-legacy-2017.zip` | `https://www.huduser.gov/datasets/lihtc/lihtcpub.zip` | `ab3e4441626c408c6900229d5635267ccdbed148e5330c97a16f93cacde0788f` | Legacy; do not use |

## Derived files

| Local file | Derived from | SHA-256 | Records |
| --- | --- | --- | ---: |
| `processed/discover/lihtc-properties-data.csv` | Current `LIHTCPUB.xlsx`, sheet `Data` | `246af259f0d4ac374af55e0f4a8c0d8cd68f368e8f00e95c4fcc8656dfcdb3d6` | 55,345 |

## Organizer-provided inputs

Received and normalized on 2026-07-19. The organizer labels the pack as a draft requiring
organizer approval; that status is preserved in `organizer/v1/governance/`.

| Local file | Provenance | SHA-256 | Status |
| --- | --- | --- | --- |
| `organizer/source/RealDoor_Hackathon_Starter_Pack_v1.zip` | Organizer-provided v1 starter pack | `6deeddccce34a099323da5322f63328bf91894c10176821d5b157ed9d82f6468` | Immutable source |
| `organizer/source/RealDoor_Hackathon_Starter_Pack_v1.contents.sha256` | Checksum manifest embedded in the source ZIP | `5f76b5d4b78c9d8a309996748d0d46250787960d2ef362d21d9f1346be5b3d3d` | Validates the unmodified archive contents |

The normalized working copy is at `organizer/v1/`. It contains 32 LIHTC properties, eight
2026 household-size limit rows, 24 synthetic documents, 24 document-gold records, 11 rules,
36 gold Q&A records, 24 adversarial tests, and six application checklists.

Thirty-one organizer LIHTC IDs also occur in the manually downloaded national HUD snapshot.
They are retained in both source-specific datasets because they have different provenance and
retrieval dates. They must not be concatenated without source-aware deduplication. Detailed
validation is recorded in `manifests/organizer-v1-quality.md`.
