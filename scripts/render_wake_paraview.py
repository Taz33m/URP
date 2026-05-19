#!/usr/bin/env python3
"""Render the synthetic wake field with ParaView."""

from __future__ import annotations

from pathlib import Path

from paraview.simple import (
    ColorBy,
    CreateView,
    Cylinder,
    Glyph,
    HideScalarBarIfNotNeeded,
    OpenDataFile,
    Render,
    SaveScreenshot,
    SaveState,
    Show,
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "evidence" / "paraview"
DATASET = OUT_DIR / "wake-flow-field.vti"


def main() -> None:
    source = OpenDataFile(str(DATASET))
    view = CreateView("RenderView")
    view.ViewSize = [1600, 1000]
    view.Background = [0.965, 0.972, 0.98]
    view.OrientationAxesVisibility = 1
    view.UseColorPaletteForBackground = 0

    field_display = Show(source, view, "GeometryRepresentation")
    field_display.Representation = "Surface"
    ColorBy(field_display, ("POINTS", "speed"))
    speed_lut = field_display.LookupTable
    speed_lut.RGBPoints = [
        0.0,
        0.12,
        0.17,
        0.40,
        0.65,
        0.05,
        0.50,
        0.62,
        1.0,
        0.95,
        0.74,
        0.24,
        1.65,
        0.88,
        0.18,
        0.16,
    ]
    speed_lut.RescaleTransferFunction(0.0, 1.65)
    field_display.SetScalarBarVisibility(view, True)

    glyph = Glyph(Input=source, GlyphType="Arrow")
    glyph.OrientationArray = ["POINTS", "velocity"]
    glyph.ScaleArray = ["POINTS", "speed"]
    glyph.ScaleFactor = 0.18
    glyph.GlyphMode = "Every Nth Point"
    glyph.Stride = 140
    glyph_display = Show(glyph, view, "GeometryRepresentation")
    glyph_display.DiffuseColor = [0.02, 0.04, 0.08]
    glyph_display.Opacity = 0.95
    glyph_display.Translation = [0.0, 0.0, 0.06]
    HideScalarBarIfNotNeeded(glyph_display.LookupTable, view)

    body = Cylinder(Resolution=96, Radius=0.45, Height=0.05)
    body_display = Show(body, view, "GeometryRepresentation")
    body_display.DiffuseColor = [0.96, 0.96, 0.94]
    body_display.EdgeColor = [0.1, 0.1, 0.1]
    body_display.Translation = [0.0, 0.0, 0.12]

    view.CameraPosition = [3.0, 0.0, 13.5]
    view.CameraFocalPoint = [3.0, 0.0, 0.0]
    view.CameraViewUp = [0.0, 1.0, 0.0]
    view.CameraParallelProjection = 1
    view.CameraParallelScale = 3.0

    Render(view)
    SaveScreenshot(str(OUT_DIR / "wake-flow-field.png"), view, ImageResolution=[1600, 1000])
    SaveState(str(OUT_DIR / "wake-flow-field.pvsm"))
    print(OUT_DIR / "wake-flow-field.png")
    print(OUT_DIR / "wake-flow-field.pvsm")


if __name__ == "__main__":
    main()
