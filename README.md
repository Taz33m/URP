# URP: CGNS Airfoil Visualization and ParaView Evidence

URP is a scientific visualization project from an RPI Undergraduate Research Project with [Dr. Shaowu Pan](https://faculty.rpi.edu/shaowu-pan), focused on inspecting a NACA 0012 airfoil CGNS dataset through a FastAPI/PyVista backend, a React/Three.js viewer, and reproducible ParaView evidence artifacts.

## Reviewer Path

Start with `paraview-cfd-visualization-pack/README.md`, inspect the rendered outputs in `paraview-cfd-visualization-pack/outputs`, then open `paraview-cfd-visualization-pack/states/airfoil_pipeline.pvsm` in ParaView. For the original CGNS evidence, open `public/data/n0012_449-129.cgns` and compare it with `evidence/paraview/urp-cgns-airfoil-mesh.png`.

## Evidence Tiers

**Primary ParaView evidence:** native CGNS reader workflow, ParaView `.pvsm` state files, generated screenshots, and inspection logs.

**Created flow-field evidence:** a synthetic CFD-style wake dataset in VTK ImageData format for vector/scalar visualization workflow review. This is not claimed as solver output.

**Web visualization evidence:** React/Three.js and FastAPI/PyVista code for loading, extracting, and rendering CGNS mesh data in a browser.

## Included Evidence

### CFD Flow Visualization Pack

The dedicated application-ready project lives in `paraview-cfd-visualization-pack/`.

| Artifact | Purpose |
| --- | --- |
| `paraview-cfd-visualization-pack/data/airfoil_flow_field.vti` | Synthetic CFD-style airfoil vector/scalar field |
| `paraview-cfd-visualization-pack/data/airfoil_body.vtp` | ParaView-readable airfoil body geometry |
| `paraview-cfd-visualization-pack/states/airfoil_pipeline.pvsm` | Reproducible ParaView pipeline state |
| `paraview-cfd-visualization-pack/scripts/generate_visuals.py` | `pvpython` automation for data, screenshots, state, and MP4 |
| `paraview-cfd-visualization-pack/outputs/01_pressure_field.png` | Pressure coefficient view |
| `paraview-cfd-visualization-pack/outputs/02_velocity_streamlines.png` | Streamline view |
| `paraview-cfd-visualization-pack/outputs/03_slice_plane_velocity.png` | Slice/clip velocity view |
| `paraview-cfd-visualization-pack/outputs/04_wake_vorticity.png` | Wake/vorticity view |
| `paraview-cfd-visualization-pack/outputs/airfoil_flow_animation.mp4` | 20-second camera animation |

### Original URP CGNS Evidence

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

This repository demonstrates scientific visualization, CGNS/VTK data handling, and ParaView pipeline construction in the context of an RPI URP with Dr. Shaowu Pan. The included wake-field dataset is synthetic and should be used as a visualization/evaluation asset, not as a validated CFD solver result.

## AI Visualization Evaluation

The file `docs/ai-sciviz-evaluation-rubric.md` defines review criteria for AI-generated scientific visualization assets, including file validity, scalar/vector integrity, provenance, colormap use, camera reproducibility, and overclaim detection.

## Reproduce ParaView Evidence

Install ParaView 6.1 or newer, then run the scripts with `pvpython`:

```bash
/Applications/ParaView-6.1.0-arm64.app/Contents/bin/pvpython scripts/inspect_cgns.py
/Applications/ParaView-6.1.0-arm64.app/Contents/bin/pvpython scripts/render_airfoil_paraview.py
python3 scripts/generate_wake_field.py
/Applications/ParaView-6.1.0-arm64.app/Contents/bin/pvpython scripts/render_wake_paraview.py
/Applications/ParaView-6.1.0-arm64.app/Contents/bin/pvpython paraview-cfd-visualization-pack/scripts/generate_visuals.py
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
