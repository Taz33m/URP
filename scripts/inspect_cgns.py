#!/usr/bin/env python3
"""Inspect the checked-in NACA 0012 CGNS file with ParaView's reader stack."""

from __future__ import annotations

from pathlib import Path

from paraview import servermanager
from paraview.simple import OpenDataFile


ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "public" / "data" / "n0012_449-129.cgns"
OUT = ROOT / "evidence" / "paraview" / "airfoil-cgns-inspection.txt"


def describe_dataset(dataset, indent: int = 0) -> list[str]:
    pad = "  " * indent
    lines = [f"{pad}{dataset.GetClassName()}"]

    is_multiblock = dataset.IsA("vtkMultiBlockDataSet")
    if not is_multiblock and hasattr(dataset, "GetNumberOfPoints"):
        point_data = dataset.GetPointData()
        cell_data = dataset.GetCellData()
        lines.append(
            f"{pad}points={dataset.GetNumberOfPoints()} cells={dataset.GetNumberOfCells()}"
        )
        lines.append(f"{pad}bounds={dataset.GetBounds()}")
        lines.append(
            f"{pad}point_arrays={[point_data.GetArrayName(i) for i in range(point_data.GetNumberOfArrays())]}"
        )
        lines.append(
            f"{pad}cell_arrays={[cell_data.GetArrayName(i) for i in range(cell_data.GetNumberOfArrays())]}"
        )

    if is_multiblock:
        lines.append(f"{pad}blocks={dataset.GetNumberOfBlocks()}")
        for i in range(dataset.GetNumberOfBlocks()):
            child = dataset.GetBlock(i)
            lines.append(f"{pad}block {i}")
            if child is None:
                lines.append(f"{pad}  None")
            else:
                lines.extend(describe_dataset(child, indent + 1))

    return lines


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    source = OpenDataFile(str(DATASET))
    source.UpdatePipeline()
    fetched = servermanager.Fetch(source)

    lines = [
        "URP NACA 0012 CGNS ParaView Inspection",
        f"dataset={DATASET.relative_to(ROOT)}",
        f"reader={source.GetXMLName()}",
        "",
        "Fetched VTK object tree:",
        *describe_dataset(fetched),
        "",
        "Interpretation:",
        "- ParaView opens the checked-in CGNS file with CGNSSeriesReader.",
        "- The dataset resolves to a nested multiblock containing a vtkStructuredGrid.",
        "- This artifact is a mesh/format-inspection sample, not a claimed solver validation study.",
    ]
    OUT.write_text("\n".join(lines) + "\n")
    print(OUT)


if __name__ == "__main__":
    main()
