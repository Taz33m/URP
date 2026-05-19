import os
from pathlib import Path

# Configure PyVista for off-screen rendering before importing pyvista.
os.environ.setdefault("PYVISTA_OFF_SCREEN", "true")
os.environ.setdefault("PYVISTA_USE_PANEL", "false")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from fastapi.exception_handlers import http_exception_handler
import pyvista as pv
import numpy as np
import sys
import traceback
import uvicorn

# Configure PyVista global theme
pv.global_theme.background = 'white'
pv.global_theme.window_size = [1024, 768]
pv.global_theme.smooth_shading = True

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception handler caught: {type(exc).__name__}: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc.detail)}
    )

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.environ.get("URP_DATA_DIR", ROOT_DIR / "public" / "data")).expanduser()
DEFAULT_FILE = "n0012_449-129.cgns"

def extract_block(mesh):
    """Recursively extract mesh from nested MultiBlock structure"""
    print(f"Extracting block from mesh type: {type(mesh)}")
    
    try:
        if isinstance(mesh, pv.MultiBlock):
            print(f"MultiBlock with {len(mesh)} blocks")
            if len(mesh) == 0:
                return None
            # Recursively process first block
            first_block = mesh[0]
            if first_block is None:
                return None
            return extract_block(first_block)
        print(f"Returning mesh of type: {type(mesh)}")
        return mesh
    except Exception as e:
        print(f"Error in extract_block: {str(e)}")
        return None

def triangulate_hex_face(vertices):
    """Convert a quad face into two triangles.
    Takes vertices in order [v0, v1, v2, v3]
    """
    try:
        return [
            [vertices[0], vertices[1], vertices[2]],  # Triangle 1
            [vertices[0], vertices[2], vertices[3]]   # Triangle 2
        ]
    except Exception as e:
        print(f"Error triangulating face: {str(e)}")
        raise

def normalize_data_array(data_array):
    """Normalize a data array to range [0, 1] for visualization."""
    try:
        if data_array is None or len(data_array) == 0:
            return None
        data_min = np.min(data_array)
        data_max = np.max(data_array)
        if data_max == data_min:
            return np.zeros_like(data_array)
        return (data_array - data_min) / (data_max - data_min)
    except Exception as e:
        print(f"Error normalizing data array: {str(e)}")
        raise

@app.get("/api/cgns/files")
async def list_cgns_files():
    try:
        print(f"\nListing CGNS files from directory: {DATA_DIR}")
        print(f"Directory exists: {DATA_DIR.exists()}")
        print(f"Directory is directory: {DATA_DIR.is_dir()}")
        
        # List all files in directory
        all_files = list(DATA_DIR.glob("*"))
        print(f"All files in directory: {[f.name for f in all_files]}")
        
        # List all .cgns files
        cgns_files = [f.name for f in DATA_DIR.glob("*.cgns")]
        print(f"CGNS files found: {cgns_files}")
        
        if not cgns_files:
            print("No CGNS files found in directory")
            cgns_files = []
        
        return JSONResponse(content={"files": cgns_files})
        
    except Exception as e:
        print(f"Error listing CGNS files: {str(e)}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to list CGNS files: {str(e)}"}
        )

@app.get("/api/cgns/{filename}")
async def get_cgns_data(filename: str):
    try:
        file_path = DATA_DIR / filename
        print(f"Reading file: {file_path}")
        
        if not file_path.exists():
            return JSONResponse(
                status_code=404,
                content={"detail": f"File not found: {filename}"}
            )
        
        print("Loading CGNS file with PyVista...")
        try:
            # Read the CGNS file
            mesh = pv.read(str(file_path))
            print(f"Initial mesh type: {type(mesh)}")
            
            # Extract actual mesh from MultiBlock structure if needed
            if isinstance(mesh, pv.MultiBlock):
                print("Processing MultiBlock structure...")
                mesh = extract_block(mesh)
                if mesh is None:
                    return JSONResponse(
                        status_code=500,
                        content={"detail": "Failed to extract valid mesh from CGNS file"}
                    )
            
            print(f"Working with mesh type: {type(mesh)}")
            print(f"Number of points: {mesh.n_points}")
            print(f"Number of cells: {mesh.n_cells}")
            
            # Extract surface for visualization
            try:
                surface = mesh.extract_surface()
                print(f"Extracted surface with {surface.n_points} points and {surface.n_cells} cells")
            except Exception as e:
                print(f"Error extracting surface: {str(e)}")
                surface = mesh  # Use the original mesh if surface extraction fails
            
            # Get vertices and convert to native Python types
            print("Converting vertices...")
            try:
                vertices = []
                for v in surface.points:
                    vertex = [float(x) for x in v]
                    vertices.append(vertex)
                print(f"Number of vertices: {len(vertices)}")
                print(f"Sample vertex: {vertices[0] if vertices else None}")
            except Exception as e:
                print(f"Error converting vertices: {str(e)}")
                print(f"Surface points type: {type(surface.points)}")
                print(f"First point type: {type(surface.points[0]) if len(surface.points) > 0 else None}")
                raise
            
            # Process cells into faces
            print("Converting faces...")
            faces = []
            try:
                for i in range(surface.n_cells):
                    cell = surface.get_cell(i)
                    if cell.n_points == 3:
                        face = [int(idx) for idx in cell.point_ids]
                        faces.append(face)
                    elif cell.n_points == 4:
                        # Convert quad to triangles
                        face_vertices = [int(idx) for idx in cell.point_ids]
                        triangles = triangulate_hex_face(face_vertices)
                        faces.extend(triangles)
                print(f"Number of faces: {len(faces)}")
                print(f"Sample face: {faces[0] if faces else None}")
            except Exception as e:
                print(f"Error converting faces: {str(e)}")
                print(f"Cell type: {type(cell)}")
                print(f"Point IDs type: {type(cell.point_ids)}")
                raise
            print(f"Processed {len(faces)} faces")
            
            # Extract solution data
            solutions = []
            try:
                point_data = mesh.point_data
                print(f"Available fields: {list(point_data.keys())}")
                
                for name, data in point_data.items():
                    if isinstance(data, np.ndarray):
                        if len(data.shape) == 1 or (len(data.shape) == 2 and data.shape[1] == 1):
                            data_1d = data.flatten()
                            solution_dict = {}
                            solution_dict[name] = data_1d.tolist()
                            solution_dict['min'] = float(np.min(data_1d))
                            solution_dict['max'] = float(np.max(data_1d))
                            solutions.append(solution_dict)
                            print(f"Added field '{name}' with range [{solution_dict['min']}, {solution_dict['max']}]")
                    else:
                        print(f"Skipping non-scalar field '{name}' with shape {data.shape}")
            except Exception as e:
                print(f"Error processing solution data: {str(e)}")
                traceback.print_exc()
                # Don't fail if solution data processing fails
                solutions = []
            
            # Create response
            try:
                bounds = [float(x) for x in surface.bounds]
                print(f"Bounds: {bounds}")
                
                response = {
                    'mesh': {
                        'vertices': vertices,
                        'elements': faces
                    },
                    'solutions': solutions,
                    'stats': {
                        'n_points': len(vertices),
                        'n_faces': len(faces),
                        'bounds': bounds
                    }
                }
                
                # Verify response is JSON serializable
                import json
                json.dumps(response)
            except Exception as e:
                print(f"Error creating response: {str(e)}")
                print("Response structure:")
                print(f"- vertices type: {type(vertices)}, len: {len(vertices)}")
                print(f"- faces type: {type(faces)}, len: {len(faces)}")
                print(f"- solutions type: {type(solutions)}, len: {len(solutions)}")
                print(f"- bounds type: {type(bounds)}, value: {bounds}")
                raise
            
            print(f"Successfully processed CGNS file:")
            print(f"- Vertices: {len(vertices)}")
            print(f"- Faces: {len(faces)}")
            print(f"- Solutions: {len(solutions)}")
            
            return JSONResponse(content=response)
            
        except Exception as e:
            print(f"Error reading CGNS file: {str(e)}")
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"detail": f"Failed to read CGNS file: {str(e)}"}
            )
            
    except Exception as e:
        print(f"Error processing CGNS file: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to process CGNS file: {str(e)}"}
        )

if __name__ == "__main__":
    print(f"\nStarting server with data directory: {DATA_DIR}")
    uvicorn.run(app, host="127.0.0.1", port=8001)
