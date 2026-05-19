# URP: CGNS Airfoil Visualization and ParaView Evidence

URP is a scientific visualization project for inspecting a NACA 0012 airfoil CGNS dataset through a FastAPI/PyVista backend, a React/Three.js viewer, and reproducible ParaView evidence artifacts.

## Reviewer Path

Start with `public/data/n0012_449-129.cgns`, open the ParaView state in `evidence/paraview/urp-cgns-airfoil-mesh.pvsm`, compare the rendered mesh with `evidence/paraview/urp-cgns-airfoil-mesh.png`, then inspect the synthetic wake-field pack in `evidence/paraview/wake-inspection-readme.md`.

## Evidence Tiers

**Primary ParaView evidence:** native CGNS reader workflow, ParaView `.pvsm` state files, generated screenshots, and inspection logs.

**Created flow-field evidence:** a synthetic CFD-style wake dataset in VTK ImageData format for vector/scalar visualization workflow review. This is not claimed as solver output.

**Web visualization evidence:** React/Three.js and FastAPI/PyVista code for loading, extracting, and rendering CGNS mesh data in a browser.

## Included Evidence

| Artifact | Purpose |
| --- | --- |
| `public/data/n0012_449-129.cgns` | Checked-in NACA 0012 CGNS airfoil dataset |
| `evidence/paraview/airfoil-cgns-inspection.txt` | ParaView reader and VTK object-tree inspection |
| `evidence/paraview/urp-cgns-airfoil-mesh.pvsm` | ParaView state for the CGNS mesh render |
| `evidence/paraview/urp-cgns-airfoil-mesh.png` | Exported ParaView mesh screenshot |
| `evidence/paraview/wake-flow-field.vti` | Synthetic CFD-style vector/scalar field |
| `evidence/paraview/wake-flow-field.pvsm` | ParaView state for wake-field inspection |
| `evidence/paraview/wake-flow-field.png` | Exported ParaView wake-field screenshot |
| `docs/ai-sciviz-evaluation-rubric.md` | Review rubric for AI-generated ParaView/scientific visualization assets |

## Scope Note

This repository demonstrates scientific visualization, CGNS/VTK data handling, and ParaView pipeline construction. The included wake-field dataset is synthetic and should be used as a visualization/evaluation asset, not as a validated CFD solver result.

## AI Visualization Evaluation

The file `docs/ai-sciviz-evaluation-rubric.md` defines review criteria for AI-generated scientific visualization assets, including file validity, scalar/vector integrity, provenance, colormap use, camera reproducibility, and overclaim detection.

## Reproduce ParaView Evidence

Install ParaView 6.1 or newer, then run the scripts with `pvpython`:

```bash
/Applications/ParaView-6.1.0-arm64.app/Contents/bin/pvpython scripts/inspect_cgns.py
/Applications/ParaView-6.1.0-arm64.app/Contents/bin/pvpython scripts/render_airfoil_paraview.py
python3 scripts/generate_wake_field.py
/Applications/ParaView-6.1.0-arm64.app/Contents/bin/pvpython scripts/render_wake_paraview.py
python3 scripts/check_evidence.py
```

## Run the Web Viewer

```bash
npm install
npm run dev
```

Backend:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8001
```

The backend serves CGNS files from `public/data` by default. Set `URP_DATA_DIR` to point at another local CGNS directory.
