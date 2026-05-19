#!/usr/bin/env python3
"""Generate a synthetic CFD-style wake field as ParaView-readable VTI.

This is an analytic visualization dataset, not solver output. It is designed to
exercise ParaView flow-field inspection workflows: scalar fields, vector glyphs,
wake deficit, pressure coefficient, and vorticity.
"""

from __future__ import annotations

from pathlib import Path
import math


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "evidence" / "paraview"
OUT_FILE = OUT_DIR / "wake-flow-field.vti"
README = OUT_DIR / "wake-inspection-readme.md"

NX = 180
NY = 96
X0 = -2.0
X1 = 8.0
Y0 = -2.4
Y1 = 2.4
RADIUS = 0.45
U_INF = 1.0


def scalar_text(values: list[float]) -> str:
    return " ".join(f"{value:.7g}" for value in values)


def vector_text(values: list[tuple[float, float, float]]) -> str:
    return " ".join(f"{x:.7g} {y:.7g} {z:.7g}" for x, y, z in values)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dx = (X1 - X0) / (NX - 1)
    dy = (Y1 - Y0) / (NY - 1)

    velocity: list[tuple[float, float, float]] = []
    speed: list[float] = []
    pressure_coefficient: list[float] = []
    wake_deficit: list[float] = []
    solid_mask: list[float] = []
    coords: list[tuple[float, float]] = []

    for j in range(NY):
        y = Y0 + j * dy
        for i in range(NX):
            x = X0 + i * dx
            coords.append((x, y))
            r2 = x * x + y * y
            inside = r2 <= RADIUS * RADIUS
            r2_safe = max(r2, RADIUS * RADIUS * 1.02)
            r4 = r2_safe * r2_safe

            # Potential-flow cylinder field outside the body.
            u = U_INF * (1.0 - RADIUS * RADIUS * (x * x - y * y) / r4)
            v = -2.0 * U_INF * RADIUS * RADIUS * x * y / r4

            # Synthetic downstream wake deficit and alternating shear layer.
            downstream = max(x, 0.0)
            wake_width = 0.22 + 0.12 * downstream
            deficit = 0.58 * math.exp(-((y / wake_width) ** 2)) * math.exp(-downstream / 4.8)
            shear = 0.28 * math.sin(3.25 * downstream) * math.exp(-downstream / 5.5)
            shear *= y * math.exp(-((y / (wake_width * 1.45)) ** 2))

            if x > 0:
                u -= deficit
                v += shear

            if inside:
                u = 0.0
                v = 0.0

            mag = math.hypot(u, v)
            velocity.append((u, v, 0.0))
            speed.append(mag)
            pressure_coefficient.append(1.0 - (mag / U_INF) ** 2)
            wake_deficit.append(max(0.0, U_INF - u))
            solid_mask.append(1.0 if inside else 0.0)

    # Central-difference vorticity: omega_z = dv/dx - du/dy.
    vorticity: list[float] = []
    for j in range(NY):
        for i in range(NX):
            idx = j * NX + i
            if i == 0 or i == NX - 1 or j == 0 or j == NY - 1:
                vorticity.append(0.0)
                continue
            u_up = velocity[(j + 1) * NX + i][0]
            u_down = velocity[(j - 1) * NX + i][0]
            v_right = velocity[j * NX + i + 1][1]
            v_left = velocity[j * NX + i - 1][1]
            vorticity.append((v_right - v_left) / (2 * dx) - (u_up - u_down) / (2 * dy))

    xml = f"""<?xml version="1.0"?>
<VTKFile type="ImageData" version="0.1" byte_order="LittleEndian">
  <ImageData WholeExtent="0 {NX - 1} 0 {NY - 1} 0 0" Origin="{X0:.7g} {Y0:.7g} 0" Spacing="{dx:.7g} {dy:.7g} 1">
    <Piece Extent="0 {NX - 1} 0 {NY - 1} 0 0">
      <PointData Vectors="velocity" Scalars="speed">
        <DataArray type="Float32" Name="velocity" NumberOfComponents="3" format="ascii">{vector_text(velocity)}</DataArray>
        <DataArray type="Float32" Name="speed" NumberOfComponents="1" format="ascii">{scalar_text(speed)}</DataArray>
        <DataArray type="Float32" Name="pressure_coefficient" NumberOfComponents="1" format="ascii">{scalar_text(pressure_coefficient)}</DataArray>
        <DataArray type="Float32" Name="wake_deficit" NumberOfComponents="1" format="ascii">{scalar_text(wake_deficit)}</DataArray>
        <DataArray type="Float32" Name="vorticity_z" NumberOfComponents="1" format="ascii">{scalar_text(vorticity)}</DataArray>
        <DataArray type="Float32" Name="solid_mask" NumberOfComponents="1" format="ascii">{scalar_text(solid_mask)}</DataArray>
      </PointData>
      <CellData/>
    </Piece>
  </ImageData>
</VTKFile>
"""
    OUT_FILE.write_text(xml)

    README.write_text(
        "\n".join(
            [
                "# CFD Wake Visualization / Flow Field Inspection Pack",
                "",
                "This is a synthetic CFD-style ParaView dataset created for scientific visualization workflow inspection. It is not claimed as solver output.",
                "",
                "## Files",
                "- `wake-flow-field.vti`: ParaView-readable image-data field with velocity, speed, pressure coefficient, wake deficit, vorticity, and solid mask arrays.",
                "- `wake-flow-field.png`: ParaView render of speed field with vector glyphs.",
                "- `wake-flow-field.pvsm`: ParaView state file for reproducing the view.",
                "",
                "## Expected Inspection",
                "- Verify the velocity vector field points primarily downstream.",
                "- Inspect the reduced-speed wake region behind the circular body.",
                "- Compare `pressure_coefficient`, `wake_deficit`, and `vorticity_z` scalar ranges.",
                "- Confirm the dataset is labeled synthetic before using it as evaluation material.",
                "",
                f"Grid: {NX} x {NY} points",
                f"Domain: x=[{X0}, {X1}], y=[{Y0}, {Y1}]",
                f"Speed range: [{min(speed):.4f}, {max(speed):.4f}]",
                f"Wake deficit range: [{min(wake_deficit):.4f}, {max(wake_deficit):.4f}]",
                f"Vorticity range: [{min(vorticity):.4f}, {max(vorticity):.4f}]",
            ]
        )
        + "\n"
    )
    print(OUT_FILE)
    print(README)


if __name__ == "__main__":
    main()
