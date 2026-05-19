#!/usr/bin/env python3
"""Render the checked-in NACA 0012 CGNS mesh through ParaView."""

from __future__ import annotations

from pathlib import Path

from paraview.simple import (
    CreateView,
    ExtractSurface,
    MergeBlocks,
    OpenDataFile,
    Render,
    SaveScreenshot,
    SaveState,
    Show,
)


ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "public" / "data" / "n0012_449-129.cgns"
OUT_DIR = ROOT / "evidence" / "paraview"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    source = OpenDataFile(str(DATASET))
    merged = MergeBlocks(Input=source)
    surface = ExtractSurface(Input=merged)

    view = CreateView("RenderView")
    view.ViewSize = [1600, 1000]
    view.Background = [0.965, 0.972, 0.98]
    view.OrientationAxesVisibility = 1
    view.UseColorPaletteForBackground = 0

    display = Show(surface, view, "GeometryRepresentation")
    display.Representation = "Surface With Edges"
    display.DiffuseColor = [0.08, 0.32, 0.58]
    display.EdgeColor = [0.02, 0.06, 0.1]
    display.LineWidth = 0.35

    # The CGNS grid lies in an X/Z airfoil plane with tiny Y thickness.
    view.CameraFocalPoint = [8.0, -0.5, 0.0]
    view.CameraPosition = [8.0, -1350.0, 0.0]
    view.CameraViewUp = [0.0, 0.0, 1.0]
    view.CameraParallelProjection = 1
    view.CameraParallelScale = 130.0

    Render(view)
    SaveScreenshot(str(OUT_DIR / "urp-cgns-airfoil-mesh.png"), view, ImageResolution=[1600, 1000])
    SaveState(str(OUT_DIR / "urp-cgns-airfoil-mesh.pvsm"))
    print(OUT_DIR / "urp-cgns-airfoil-mesh.png")
    print(OUT_DIR / "urp-cgns-airfoil-mesh.pvsm")


if __name__ == "__main__":
    main()
