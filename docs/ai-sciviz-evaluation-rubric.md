# AI Scientific Visualization Evaluation Rubric

This rubric is for reviewing AI-generated ParaView or scientific visualization assets before accepting them as useful evaluation/training material.

## Pass Criteria

An asset is acceptable only when:

- The data file opens in ParaView without fatal errors.
- The file format is correctly identified, such as CGNS, VTI, VTU, VTP, VTS, or PVD.
- The visualization state is reproducible from a `.pvsm` file or a documented `pvpython` script.
- Scalar and vector arrays are named, inspectable, and matched to the visual claims.
- The camera, color map, scalar range, and representation are documented enough for a reviewer to reproduce the image.
- Synthetic/generated datasets are clearly labeled as synthetic.
- Solver, experiment, or production claims are not made unless the source data proves them.

## Common Failure Modes

| Failure type | Broken asset | Corrected asset | Reviewer check |
| --- | --- | --- | --- |
| Format overclaim | PNG-only render described as ParaView evidence | Native `.pvsm` plus `.cgns/.vti/.vtp` source | Open the linked data and state files in ParaView |
| Missing provenance | CFD-looking image with no source data | Data file, generation script, and scope note | Verify source path and generation method |
| Wrong scalar range | Colormap hides extrema or clips wake region | Explicit scalar range and colorbar | Compare array min/max to displayed range |
| Vector mismatch | Glyphs use the wrong component or scalar array | Glyphs oriented by `velocity` and scaled by `speed` | Inspect glyph filter properties |
| Misleading color map | Decorative rainbow map implies precision | Purposeful map with documented field | Confirm field name and interpretation |
| Axis inversion | Airfoil or wake plotted with swapped axes | Camera/view notes explain coordinate plane | Check bounds and camera direction |
| Unsupported evidence | State file references missing local paths | Relative paths or included source files | Reopen `.pvsm` from a fresh clone |
| Solver overclaim | Synthetic flow described as validated CFD | Labeled synthetic flow-field inspection sample | Confirm no solver validation claim is present |

## Scoring

Score each asset from 0 to 2 in each category.

| Category | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Openability | Does not open | Opens with warnings or missing paths | Opens cleanly from repo files |
| Data integrity | Arrays missing or unclear | Some arrays inspectable | Arrays named, documented, and consistent |
| Reproducibility | Image only | Partial script or state | Script/state regenerates evidence |
| Visual honesty | Overclaims result | Scope note exists but weak | Claims are precise and bounded |
| Reviewer usefulness | Pretty but hard to inspect | Some useful artifacts | Clear reviewer path and evidence table |

Recommended acceptance threshold: at least 8 out of 10, with no zero in Openability or Visual honesty.
