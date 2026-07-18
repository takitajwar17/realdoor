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

## Missing organizer-provided inputs

- Frozen 2026 MTSP limits and official rules corpus
- Selected metro subset and data dictionary
- Synthetic household documents
- Gold fields and source boxes
- Gold application checklist
- Gold Q&A and adversarial tests
- Starter repository and license manifest
