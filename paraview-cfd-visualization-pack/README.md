# ParaView CFD Visualization Pack: Airflow, Pressure, and Vorticity Around an Airfoil

This pack extends the URP airfoil/CGNS visualization work from an RPI Undergraduate Research Project with [Dr. Shaowu Pan](https://faculty.rpi.edu/shaowu-pan). It demonstrates a reproducible ParaView asset-production workflow for scientific visualization review by turning a generated airfoil flow-field dataset into clean screenshots, ParaView state files, and a short animation.

## Reviewer Path

1. Open `states/airfoil_pipeline.pvsm` in ParaView.
2. Inspect `data/airfoil_flow_field.vti` and `data/airfoil_body.vtp`.
3. Compare the rendered outputs in `outputs/`.
4. Read `notes/visualization_decisions.md` for the interpretation and scope limits.

The checked-in `.pvsm` uses repo-root-relative data paths. If ParaView is launched from a different working directory and cannot resolve the data files, run the regeneration script below; it rebuilds the state file for the local checkout.

## Outputs

| Output | Purpose |
| --- | --- |
| `outputs/01_pressure_field.png` | Pressure coefficient field around the airfoil body |
| `outputs/02_velocity_streamlines.png` | Stream traces and directionality of the airflow |
| `outputs/03_slice_plane_velocity.png` | Slice/clip-style inspection of the velocity field |
| `outputs/04_wake_vorticity.png` | Wake and vorticity structure behind the airfoil |
| `outputs/airfoil_flow_animation.mp4` | 20-second camera animation with stable movement and legend |

## Reproduce

Run from this repository root:

```bash
/Applications/ParaView-6.1.0-arm64.app/Contents/bin/pvpython paraview-cfd-visualization-pack/scripts/generate_visuals.py
```

The script regenerates the VTK data, ParaView state files, screenshots, animation frames, and MP4.

## Scope Note

The flow field is synthetic CFD-style data generated for visualization workflow evaluation. It is not claimed as validated CFD solver output. The purpose is to demonstrate ParaView data loading, pipeline construction, scalar/vector inspection, screenshot export, animation export, and reviewer-facing documentation alongside the original URP CGNS mesh context.
