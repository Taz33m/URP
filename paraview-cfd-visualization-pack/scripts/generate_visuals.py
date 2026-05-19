#!/usr/bin/env python3
"""Generate a reproducible ParaView CFD visualization evidence pack.

Run with pvpython from the repository root:

    /Applications/ParaView-6.1.0-arm64.app/Contents/bin/pvpython paraview-cfd-visualization-pack/scripts/generate_visuals.py
"""

from __future__ import annotations

from pathlib import Path
import math
import shutil
import subprocess

from paraview.simple import (
    Clip,
    ColorBy,
    CreateView,
    Delete,
    HideScalarBarIfNotNeeded,
    OpenDataFile,
    Render,
    ResetSession,
    SaveScreenshot,
    SaveState,
    Show,
    Slice,
    StreamTracer,
    Text,
)


ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / "paraview-cfd-visualization-pack"
DATA_DIR = PACK / "data"
STATE_DIR = PACK / "states"
OUTPUT_DIR = PACK / "outputs"
FRAME_DIR = OUTPUT_DIR / "frames"

NX = 190
NY = 112
NZ = 9
X0, X1 = -0.9, 4.2
Y0, Y1 = -1.45, 1.45
Z0, Z1 = -0.12, 0.12
CHORD = 1.0
THICKNESS = 0.12
AOA = math.radians(5.0)
U_INF = 1.0


def ensure_dirs() -> None:
    for directory in (DATA_DIR, STATE_DIR, OUTPUT_DIR):
        directory.mkdir(parents=True, exist_ok=True)
    if FRAME_DIR.exists():
        shutil.rmtree(FRAME_DIR)
    FRAME_DIR.mkdir(parents=True, exist_ok=True)


def naca_thickness(x: float) -> float:
    x = min(max(x, 0.0), 1.0)
    return 5.0 * THICKNESS * (
        0.2969 * math.sqrt(max(x, 1e-9))
        - 0.1260 * x
        - 0.3516 * x**2
        + 0.2843 * x**3
        - 0.1015 * x**4
    )


def airfoil_local(x: float, y: float) -> tuple[float, float]:
    # Rotate world coordinates into the airfoil frame.
    cx, cy = 0.0, 0.0
    xr = x - cx
    yr = y - cy
    ca = math.cos(-AOA)
    sa = math.sin(-AOA)
    return ca * xr - sa * yr, sa * xr + ca * yr


def world_from_airfoil(x: float, y: float, z: float = 0.018) -> tuple[float, float, float]:
    ca = math.cos(AOA)
    sa = math.sin(AOA)
    return ca * x - sa * y, sa * x + ca * y, z


def in_airfoil(x: float, y: float) -> bool:
    xa, ya = airfoil_local(x, y)
    return 0.0 <= xa <= CHORD and abs(ya) <= naca_thickness(xa)


def scalar_text(values: list[float]) -> str:
    return " ".join(f"{value:.7g}" for value in values)


def vector_text(values: list[tuple[float, float, float]]) -> str:
    return " ".join(f"{x:.7g} {y:.7g} {z:.7g}" for x, y, z in values)


def generate_field() -> None:
    dx = (X1 - X0) / (NX - 1)
    dy = (Y1 - Y0) / (NY - 1)
    dz = (Z1 - Z0) / (NZ - 1)

    layer_velocity: list[tuple[float, float, float]] = []
    layer_speed: list[float] = []
    layer_cp: list[float] = []
    layer_wake: list[float] = []
    layer_mask: list[float] = []

    for j in range(NY):
        y = Y0 + j * dy
        for i in range(NX):
            x = X0 + i * dx
            xa, ya = airfoil_local(x, y)
            body = in_airfoil(x, y)

            # Smooth analytic flow features: upstream flow, leading-edge stagnation,
            # upper-surface acceleration, and downstream wake deficit.
            leading = math.exp(-((xa + 0.02) / 0.18) ** 2 - (ya / 0.22) ** 2)
            upper_accel = math.exp(-((xa - 0.36) / 0.42) ** 2 - ((ya - 0.12) / 0.22) ** 2)
            lower_pressure = math.exp(-((xa - 0.28) / 0.34) ** 2 - ((ya + 0.10) / 0.24) ** 2)
            downstream = max(xa - 0.95, 0.0)
            wake_width = 0.13 + 0.11 * downstream
            wake_core = math.exp(-((ya / wake_width) ** 2)) * math.exp(-downstream / 2.7)
            shear = 0.12 * math.sin(7.5 * downstream) * ya * math.exp(-((ya / (wake_width * 1.6)) ** 2))
            shear *= math.exp(-downstream / 3.4)

            ua = U_INF - 0.65 * leading + 0.55 * upper_accel - 0.18 * lower_pressure
            va = 0.05 + 0.16 * upper_accel - 0.08 * lower_pressure
            if xa > 0.95:
                ua -= 0.55 * wake_core
                va += shear

            ca = math.cos(AOA)
            sa = math.sin(AOA)
            u = ca * ua - sa * va
            v = sa * ua + ca * va
            if body:
                u = 0.0
                v = 0.0

            speed = math.hypot(u, v)
            cp = 1.0 - (speed / U_INF) ** 2
            cp += 0.22 * lower_pressure - 0.34 * upper_accel
            wake_deficit = max(0.0, U_INF - ua)

            layer_velocity.append((u, v, 0.0))
            layer_speed.append(speed)
            layer_cp.append(cp)
            layer_wake.append(wake_deficit)
            layer_mask.append(1.0 if body else 0.0)

    layer_vorticity: list[float] = []
    for j in range(NY):
        for i in range(NX):
            if i == 0 or i == NX - 1 or j == 0 or j == NY - 1:
                layer_vorticity.append(0.0)
                continue
            u_up = layer_velocity[(j + 1) * NX + i][0]
            u_down = layer_velocity[(j - 1) * NX + i][0]
            v_right = layer_velocity[j * NX + i + 1][1]
            v_left = layer_velocity[j * NX + i - 1][1]
            layer_vorticity.append((v_right - v_left) / (2 * dx) - (u_up - u_down) / (2 * dy))

    velocity: list[tuple[float, float, float]] = []
    speed: list[float] = []
    cp: list[float] = []
    wake: list[float] = []
    mask: list[float] = []
    vorticity: list[float] = []
    for k in range(NZ):
        z = Z0 + k * dz
        z_factor = 1.0 - 0.06 * abs(z) / max(abs(Z0), 1e-9)
        for idx, (u, v, _) in enumerate(layer_velocity):
            velocity.append((u * z_factor, v * z_factor, 0.0))
            speed.append(layer_speed[idx] * z_factor)
            cp.append(layer_cp[idx])
            wake.append(layer_wake[idx])
            mask.append(layer_mask[idx])
            vorticity.append(layer_vorticity[idx] * z_factor)

    (DATA_DIR / "airfoil_flow_field.vti").write_text(
        f"""<?xml version="1.0"?>
<VTKFile type="ImageData" version="0.1" byte_order="LittleEndian">
  <ImageData WholeExtent="0 {NX - 1} 0 {NY - 1} 0 {NZ - 1}" Origin="{X0:.7g} {Y0:.7g} {Z0:.7g}" Spacing="{dx:.7g} {dy:.7g} {dz:.7g}">
    <Piece Extent="0 {NX - 1} 0 {NY - 1} 0 {NZ - 1}">
      <PointData Vectors="velocity" Scalars="speed">
        <DataArray type="Float32" Name="velocity" NumberOfComponents="3" format="ascii">{vector_text(velocity)}</DataArray>
        <DataArray type="Float32" Name="speed" NumberOfComponents="1" format="ascii">{scalar_text(speed)}</DataArray>
        <DataArray type="Float32" Name="pressure_coefficient" NumberOfComponents="1" format="ascii">{scalar_text(cp)}</DataArray>
        <DataArray type="Float32" Name="wake_deficit" NumberOfComponents="1" format="ascii">{scalar_text(wake)}</DataArray>
        <DataArray type="Float32" Name="vorticity_z" NumberOfComponents="1" format="ascii">{scalar_text(vorticity)}</DataArray>
        <DataArray type="Float32" Name="airfoil_mask" NumberOfComponents="1" format="ascii">{scalar_text(mask)}</DataArray>
      </PointData>
      <CellData/>
    </Piece>
  </ImageData>
</VTKFile>
"""
    )


def generate_airfoil_body() -> None:
    upper: list[tuple[float, float, float]] = []
    lower: list[tuple[float, float, float]] = []
    for i in range(90):
        x = i / 89
        t = naca_thickness(x)
        upper.append(world_from_airfoil(x, t))
        lower.append(world_from_airfoil(x, -t))
    outline = upper + lower[::-1]
    points = " ".join(f"{x:.7g} {y:.7g} {z:.7g}" for x, y, z in outline)
    connectivity = " ".join(str(i) for i in range(len(outline)))
    offsets = str(len(outline))
    (DATA_DIR / "airfoil_body.vtp").write_text(
        f"""<?xml version="1.0"?>
<VTKFile type="PolyData" version="0.1" byte_order="LittleEndian">
  <PolyData>
    <Piece NumberOfPoints="{len(outline)}" NumberOfVerts="0" NumberOfLines="0" NumberOfStrips="0" NumberOfPolys="1">
      <PointData/>
      <CellData/>
      <Points>
        <DataArray type="Float32" Name="Points" NumberOfComponents="3" format="ascii">{points}</DataArray>
      </Points>
      <Polys>
        <DataArray type="Int32" Name="connectivity" format="ascii">{connectivity}</DataArray>
        <DataArray type="Int32" Name="offsets" format="ascii">{offsets}</DataArray>
      </Polys>
    </Piece>
  </PolyData>
</VTKFile>
"""
    )


def add_text(view, label: str):
    text = Text(Text=label)
    display = Show(text, view)
    display.WindowLocation = "Upper Left Corner"
    display.FontSize = 18
    display.Color = [0.05, 0.07, 0.10]
    return text


def color_display(display, view, field: str, points: list[float], show_bar=True):
    ColorBy(display, ("POINTS", field))
    lut = display.LookupTable
    lut.RGBPoints = points
    lut.RescaleTransferFunction(points[0], points[-4])
    if show_bar:
        display.SetScalarBarVisibility(view, True)
    return lut


def base_view(width: int = 1600, height: int = 1000):
    view = CreateView("RenderView")
    view.ViewSize = [width, height]
    view.Background = [0.965, 0.972, 0.98]
    view.OrientationAxesVisibility = 1
    view.UseColorPaletteForBackground = 0
    return view


def add_body(view):
    body = OpenDataFile(str(DATA_DIR / "airfoil_body.vtp"))
    body_display = Show(body, view, "GeometryRepresentation")
    body_display.DiffuseColor = [0.96, 0.96, 0.92]
    body_display.EdgeColor = [0.08, 0.08, 0.08]
    return body


def midplane_slice(source):
    plane = Slice(Input=source)
    plane.SliceType = "Plane"
    plane.SliceType.Origin = [1.4, 0.0, 0.0]
    plane.SliceType.Normal = [0.0, 0.0, 1.0]
    return plane


def frame_top_down(view, scale: float = 1.75, focal_x: float = 1.45):
    view.CameraPosition = [focal_x, 0.0, 8.2]
    view.CameraFocalPoint = [focal_x, 0.0, 0.0]
    view.CameraViewUp = [0.0, 1.0, 0.0]
    view.CameraParallelProjection = 1
    view.CameraParallelScale = scale


def render_pressure() -> None:
    ResetSession()
    source = OpenDataFile(str(DATA_DIR / "airfoil_flow_field.vti"))
    plane = midplane_slice(source)
    view = base_view()
    display = Show(plane, view, "GeometryRepresentation")
    display.Representation = "Surface"
    color_display(
        display,
        view,
        "pressure_coefficient",
        [-1.05, 0.07, 0.19, 0.48, -0.25, 0.05, 0.48, 0.62, 0.35, 0.95, 0.78, 0.30, 1.25, 0.78, 0.12, 0.12],
    )
    add_body(view)
    add_text(view, "Pressure coefficient field around NACA-style airfoil")
    frame_top_down(view)
    Render(view)
    SaveScreenshot(str(OUTPUT_DIR / "01_pressure_field.png"), view, ImageResolution=[1600, 1000])


def render_streamlines() -> None:
    ResetSession()
    source = OpenDataFile(str(DATA_DIR / "airfoil_flow_field.vti"))
    plane = midplane_slice(source)
    view = base_view()
    bg = Show(plane, view, "GeometryRepresentation")
    bg.Representation = "Surface"
    bg.Opacity = 0.34
    color_display(bg, view, "speed", [0.0, 0.12, 0.17, 0.40, 0.65, 0.05, 0.50, 0.62, 1.0, 0.95, 0.74, 0.24, 1.65, 0.88, 0.18, 0.16])

    stream = StreamTracer(Input=source, SeedType="Line")
    stream.Vectors = ["POINTS", "velocity"]
    stream.SeedType.Point1 = [-0.78, -1.12, 0.0]
    stream.SeedType.Point2 = [-0.78, 1.12, 0.0]
    stream.SeedType.Resolution = 48
    stream.MaximumStreamlineLength = 5.4
    stream_display = Show(stream, view, "GeometryRepresentation")
    stream_display.LineWidth = 2.2
    ColorBy(stream_display, ("POINTS", "speed"))
    stream_display.SetScalarBarVisibility(view, False)
    add_body(view)
    add_text(view, "Velocity streamlines seeded upstream and colored by speed")
    frame_top_down(view)
    Render(view)
    SaveScreenshot(str(OUTPUT_DIR / "02_velocity_streamlines.png"), view, ImageResolution=[1600, 1000])


def render_slice_plane() -> None:
    ResetSession()
    source = OpenDataFile(str(DATA_DIR / "airfoil_flow_field.vti"))
    clip = Clip(Input=source)
    clip.ClipType = "Plane"
    clip.ClipType.Origin = [0.0, 0.0, 0.0]
    clip.ClipType.Normal = [0.0, 1.0, 0.0]
    clip.Invert = 0

    view = base_view()
    context = Show(clip, view, "GeometryRepresentation")
    context.Representation = "Surface With Edges"
    context.EdgeColor = [0.18, 0.20, 0.22]
    context.LineWidth = 0.25
    color_display(context, view, "speed", [0.0, 0.12, 0.17, 0.40, 0.65, 0.05, 0.50, 0.62, 1.0, 0.95, 0.74, 0.24, 1.65, 0.88, 0.18, 0.16])
    add_body(view)
    add_text(view, "Clipped half-volume showing velocity magnitude through the flow field")
    view.CameraPosition = [2.15, -3.4, 2.25]
    view.CameraFocalPoint = [1.45, 0.0, 0.0]
    view.CameraViewUp = [-0.18, 0.28, 0.94]
    view.CameraParallelProjection = 1
    view.CameraParallelScale = 1.62
    Render(view)
    SaveScreenshot(str(OUTPUT_DIR / "03_slice_plane_velocity.png"), view, ImageResolution=[1600, 1000])


def render_vorticity() -> None:
    ResetSession()
    source = OpenDataFile(str(DATA_DIR / "airfoil_flow_field.vti"))
    plane = midplane_slice(source)
    view = base_view()
    display = Show(plane, view, "GeometryRepresentation")
    display.Representation = "Surface"
    color_display(
        display,
        view,
        "vorticity_z",
        [-9.0, 0.13, 0.16, 0.42, -1.5, 0.16, 0.64, 0.74, 0.0, 0.96, 0.96, 0.88, 1.5, 0.93, 0.56, 0.20, 9.0, 0.65, 0.08, 0.10],
    )
    add_body(view)
    add_text(view, "Wake vorticity field with diverging range around zero")
    frame_top_down(view)
    Render(view)
    SaveScreenshot(str(OUTPUT_DIR / "04_wake_vorticity.png"), view, ImageResolution=[1600, 1000])


def render_animation() -> None:
    ResetSession()
    source = OpenDataFile(str(DATA_DIR / "airfoil_flow_field.vti"))
    plane = midplane_slice(source)
    view = base_view(1280, 720)
    display = Show(plane, view, "GeometryRepresentation")
    display.Representation = "Surface"
    color_display(display, view, "speed", [0.0, 0.12, 0.17, 0.40, 0.65, 0.05, 0.50, 0.62, 1.0, 0.95, 0.74, 0.24, 1.65, 0.88, 0.18, 0.16])
    stream = StreamTracer(Input=source, SeedType="Line")
    stream.Vectors = ["POINTS", "velocity"]
    stream.SeedType.Point1 = [-0.78, -1.05, 0.0]
    stream.SeedType.Point2 = [-0.78, 1.05, 0.0]
    stream.SeedType.Resolution = 38
    stream.MaximumStreamlineLength = 5.4
    stream_display = Show(stream, view, "GeometryRepresentation")
    stream_display.LineWidth = 1.7
    stream_display.DiffuseColor = [0.03, 0.04, 0.06]
    if getattr(stream_display, "LookupTable", None):
        HideScalarBarIfNotNeeded(stream_display.LookupTable, view)
    add_body(view)
    text = add_text(view, "Airfoil flow field: speed, streamlines, and wake structure")

    total_frames = 120
    for frame in range(total_frames):
        t = frame / (total_frames - 1)
        focal_x = 0.42 + 2.05 * t
        scale = 1.18 + 0.70 * math.sin(math.pi * t) + 0.25 * t
        z = 7.0 - 1.15 * math.sin(math.pi * t)
        y = -0.28 * math.sin(2.0 * math.pi * t)
        view.CameraPosition = [focal_x, y, z]
        view.CameraFocalPoint = [focal_x, 0.0, 0.0]
        view.CameraViewUp = [0.0, 1.0, 0.0]
        view.CameraParallelProjection = 1
        view.CameraParallelScale = scale
        if frame == 42:
            text.Text = "Velocity streamlines reveal attached flow and wake deficit"
        elif frame == 82:
            text.Text = "Downstream camera pass focuses on wake structure"
        Render(view)
        SaveScreenshot(str(FRAME_DIR / f"frame_{frame:04d}.png"), view, ImageResolution=[1280, 720])

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required to encode airfoil_flow_animation.mp4")
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-framerate",
            "6",
            "-i",
            str(FRAME_DIR / "frame_%04d.png"),
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(OUTPUT_DIR / "airfoil_flow_animation.mp4"),
        ],
        check=True,
    )


def relativize_state_paths(path: Path) -> None:
    text = path.read_text()
    replacements = {
        str(DATA_DIR / "airfoil_flow_field.vti"): "paraview-cfd-visualization-pack/data/airfoil_flow_field.vti",
        str(DATA_DIR / "airfoil_body.vtp"): "paraview-cfd-visualization-pack/data/airfoil_body.vtp",
    }
    for absolute, relative in replacements.items():
        text = text.replace(absolute, relative)
    path.write_text(text)


def save_state() -> None:
    ResetSession()
    source = OpenDataFile(str(DATA_DIR / "airfoil_flow_field.vti"))
    plane = midplane_slice(source)
    view = base_view()
    display = Show(plane, view, "GeometryRepresentation")
    display.Representation = "Surface"
    color_display(display, view, "pressure_coefficient", [-1.05, 0.07, 0.19, 0.48, -0.25, 0.05, 0.48, 0.62, 0.35, 0.95, 0.78, 0.30, 1.25, 0.78, 0.12, 0.12])
    stream = StreamTracer(Input=source, SeedType="Line")
    stream.Vectors = ["POINTS", "velocity"]
    stream.SeedType.Point1 = [-0.78, -1.12, 0.0]
    stream.SeedType.Point2 = [-0.78, 1.12, 0.0]
    stream.SeedType.Resolution = 48
    stream.MaximumStreamlineLength = 5.4
    stream_display = Show(stream, view, "GeometryRepresentation")
    stream_display.LineWidth = 2.0
    add_body(view)
    add_text(view, "Reproducible ParaView pipeline: pressure, streamlines, slices, vorticity")
    frame_top_down(view)
    Render(view)
    state_path = STATE_DIR / "airfoil_pipeline.pvsm"
    SaveState(str(state_path))
    relativize_state_paths(state_path)


def main() -> None:
    ensure_dirs()
    generate_field()
    generate_airfoil_body()
    render_pressure()
    render_streamlines()
    render_slice_plane()
    render_vorticity()
    save_state()
    render_animation()
    print("Generated ParaView CFD visualization pack:")
    for path in [
        DATA_DIR / "airfoil_flow_field.vti",
        DATA_DIR / "airfoil_body.vtp",
        STATE_DIR / "airfoil_pipeline.pvsm",
        OUTPUT_DIR / "01_pressure_field.png",
        OUTPUT_DIR / "02_velocity_streamlines.png",
        OUTPUT_DIR / "03_slice_plane_velocity.png",
        OUTPUT_DIR / "04_wake_vorticity.png",
        OUTPUT_DIR / "airfoil_flow_animation.mp4",
    ]:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
