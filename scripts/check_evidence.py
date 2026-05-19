#!/usr/bin/env python3
"""Check that reviewer-facing ParaView evidence artifacts exist."""

from __future__ import annotations

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "public/data/n0012_449-129.cgns",
    "evidence/paraview/version-paraview.txt",
    "evidence/paraview/airfoil-cgns-inspection.txt",
    "evidence/paraview/urp-cgns-airfoil-mesh.png",
    "evidence/paraview/urp-cgns-airfoil-mesh.pvsm",
    "evidence/paraview/wake-flow-field.vti",
    "evidence/paraview/wake-flow-field.png",
    "evidence/paraview/wake-flow-field.pvsm",
    "evidence/paraview/wake-inspection-readme.md",
]


def main() -> int:
    missing = [path for path in REQUIRED if not (ROOT / path).is_file()]
    if missing:
        print("Missing evidence artifacts:")
        for path in missing:
            print(f"- {path}")
        return 1

    print("All required ParaView evidence artifacts are present.")
    for path in REQUIRED:
        size = (ROOT / path).stat().st_size
        print(f"- {path} ({size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
