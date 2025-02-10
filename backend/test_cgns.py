import pyvista as pv
from pathlib import Path

def extract_mesh_from_multiblock(block):
    """Recursively extract mesh from nested MultiBlock structure"""
    if isinstance(block, pv.MultiBlock):
        if len(block) == 0:
            return None
        # Recursively process first block
        return extract_mesh_from_multiblock(block[0])
    return block

# Test file reading
data_dir = Path(__file__).parent.parent / "data" / "files"
test_file = data_dir / "n0012_449-129.cgns"

print(f"Testing file: {test_file}")
print(f"File exists: {test_file.exists()}")

# Read the mesh directly
print("\nReading mesh...")
mesh = pv.read(str(test_file))
print(f"Initial mesh type: {type(mesh)}")

# Extract actual mesh from MultiBlock structure
mesh = extract_mesh_from_multiblock(mesh)
if mesh is None:
    print("Failed to extract mesh from MultiBlock structure")
    exit(1)

print(f"\nExtracted mesh type: {type(mesh)}")
print(f"Number of points: {mesh.n_points}")
print(f"Number of cells: {mesh.n_cells}")
print(f"Available arrays: {mesh.array_names}")

# Extract surface
surface = mesh.extract_surface()
print(f"\nExtracted surface:")
print(f"Number of points: {surface.n_points}")
print(f"Number of cells: {surface.n_cells}")
print(f"Available arrays: {surface.array_names}")
