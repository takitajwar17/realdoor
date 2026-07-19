# Data Source Manifest

## Immutable inputs

| Local file | Source | SHA-256 | Status |
| --- | --- | --- | --- |
| `raw/realdoor/RealDoor_Hackathon_Starter_Pack_v1.zip` | Supplied RealDoor starter pack v1 | `6deeddccce34a099323da5322f63328bf91894c10176821d5b157ed9d82f6468` | Primary challenge source; draft approval status |
| `raw/realdoor/RealDoor_Hackathon_Starter_Pack_v1.contents.sha256` | Manifest embedded in the source ZIP | `5f76b5d4b78c9d8a309996748d0d46250787960d2ef362d21d9f1346be5b3d3d` | Validated before normalization |
| `raw/hud/lihtc/lihtcpub.zip` | `https://www.huduser.gov/lihtc/lihtcpub.zip` | `e07acee706174b276f89596d614ac5699efa9848659e5834fdfb5198fa0a7288` | National property snapshot, retrieved 2026-07-19 |
| `raw/hud/lihtc/LIHTCPUB-legacy-2017.zip` | Retired HUD download URL | `ab3e4441626c408c6900229d5635267ccdbed148e5330c97a16f93cacde0788f` | Historical; do not use in the product |
| `raw/hud/mtsp/MTSP-Data-FY25.xlsx` | Official HUD FY 2025 MTSP data | `25dc663874f87311c1940da3ec73d451c01223e3b3b622a1dfd0fe6ba36705e3` | Reference only |
| `raw/hud/mtsp/MTSP-IncAvg-Data-FY25.xlsx` | Official HUD FY 2025 income-averaging data | `5122c2575636a2d28df11eeb482379392510e5d40c2518ba418f3ba0f4ebd07e` | Reference only |
| `raw/hud/mtsp/MTSP-Briefing-25.pdf` | Official HUD FY 2025 methodology | `7c44fe032028532b611596799a21c54ef6395afde9a5080fdba15613f295490b` | Reference only |

## Canonical outputs

| Local file | Construction | Records |
| --- | --- | ---: |
| `processed/lihtc-properties.csv` | National HUD snapshot merged with supplied subset on `hud_id`; nonblank supplied fields take precedence | 55,346 |
| `processed/mtsp-limits-2026.csv` | Frozen 2026 Boston-Cambridge-Quincy limits | 8 |
| `processed/rules.jsonl` | Frozen rules corpus | 11 |
| `processed/documents/` | Synthetic application documents | 24 |
| `processed/gold/document-gold.jsonl` | Expected document fields and source boxes | 24 |
| `processed/gold/scenario-gold.csv` | Scenario outcomes extracted from the source workbook's unique sheet | 6 |
| `processed/evaluation/qa-gold.jsonl` | Gold questions and answers | 36 |
| `processed/evaluation/adversarial-tests.jsonl` | Adversarial evaluation cases | 24 |
| `processed/evaluation/application-checklists.json` | Expected application checklists | 6 |

The processed property table contains one row per `hud_id`: 55,314 national-only rows, 31
merged rows, and one supplied-only row. Source provenance is stored on every row.
