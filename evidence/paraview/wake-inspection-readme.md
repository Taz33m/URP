# CFD Wake Visualization / Flow Field Inspection Pack

This is a synthetic CFD-style ParaView dataset created for scientific visualization workflow inspection. It is not claimed as solver output.

## Files
- `wake-flow-field.vti`: ParaView-readable image-data field with velocity, speed, pressure coefficient, wake deficit, vorticity, and solid mask arrays.
- `wake-flow-field.png`: ParaView render of speed field with vector glyphs.
- `wake-flow-field.pvsm`: ParaView state file for reproducing the view.

## Expected Inspection
- Verify the velocity vector field points primarily downstream.
- Inspect the reduced-speed wake region behind the circular body.
- Compare `pressure_coefficient`, `wake_deficit`, and `vorticity_z` scalar ranges.
- Confirm the dataset is labeled synthetic before using it as evaluation material.

Grid: 180 x 96 points
Domain: x=[-2.0, 8.0], y=[-2.4, 2.4]
Speed range: [0.0000, 1.8727]
Wake deficit range: [0.0000, 1.4790]
Vorticity range: [-23.1288, 23.1288]
