# Visualization Decisions

## Dataset

The dataset is a synthetic CFD-style airfoil flow field. It contains:

- `velocity`: vector field for streamlines and glyph inspection.
- `speed`: scalar velocity magnitude.
- `pressure_coefficient`: pressure-style scalar field for airfoil loading visualization.
- `wake_deficit`: reduced downstream velocity region behind the airfoil.
- `vorticity_z`: derived central-difference curl component.
- `airfoil_mask`: body mask used to separate the flow field from the airfoil shape.

The airfoil body is also exported as `data/airfoil_body.vtp` so ParaView can render the solid body independently from the flow volume.

## Views

`01_pressure_field.png` uses a slice through the mid-plane and a bounded pressure-coefficient color range so the leading-edge and upper/lower surface pressure regions are visible without saturating the wake.

`02_velocity_streamlines.png` uses a line seed upstream of the airfoil and colors traces by speed. This view is meant to prove the vector array is usable for ParaView stream tracing, not to claim solver convergence.

`03_slice_plane_velocity.png` shows an oblique slice through the volume and a clipped context layer. The goal is to demonstrate slice/clip setup and camera framing for internal flow-field inspection.

`04_wake_vorticity.png` uses a diverging range around zero for `vorticity_z` so wake shear structures remain visible.

`airfoil_flow_animation.mp4` is a 20-second camera move over the same ParaView pipeline. It prioritizes stable camera motion, visible scalar legend, and reproducibility over cinematic effects.

## Review Notes

This pack is acceptable as a ParaView/scientific visualization evidence asset because the source data, ParaView states, automation script, rendered outputs, and scope note are all included. It should not be described as a validated CFD study unless replaced with solver-produced data and corresponding solver metadata.
