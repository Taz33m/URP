import { fetchCGNSData } from './api';

export interface CGNSData {
  mesh: {
    vertices: number[][];
    elements: number[][];
  };
  solutions: {
    [fieldName: string]: Float32Array;
  }[];
  stats: {
    n_points: number;
    n_faces: number;
    bounds: number[];
  };
}

export const processCGNSData = async (filename: string): Promise<CGNSData> => {
  try {
    if (!filename) {
      throw new Error('No filename provided');
    }

    console.log('Fetching CGNS data for file:', filename);
    const response = await fetchCGNSData(filename);
    console.log('Raw response:', response);
    
    // Validate response structure
    if (!response) {
      throw new Error('No response received from server');
    }
    if (!response.mesh) {
      throw new Error('Response missing mesh data');
    }
    if (!response.mesh.vertices) {
      throw new Error('Mesh missing vertices data');
    }
    if (!response.mesh.elements) {
      throw new Error('Mesh missing elements data');
    }
    
    // Validate data types
    if (!Array.isArray(response.mesh.vertices)) {
      throw new Error('Vertices data is not an array');
    }
    if (!Array.isArray(response.mesh.elements)) {
      throw new Error('Elements data is not an array');
    }
    
    // Validate data contents
    if (response.mesh.vertices.length === 0) {
      throw new Error('Vertices array is empty');
    }
    if (response.mesh.elements.length === 0) {
      throw new Error('Elements array is empty');
    }
    
    // Convert the backend response format to the frontend format
    const cgnsData: CGNSData = {
      mesh: {
        vertices: response.mesh.vertices,
        elements: response.mesh.elements
      },
      solutions: [],
      stats: response.stats || {
        n_points: response.mesh.vertices.length,
        n_faces: response.mesh.elements.length,
        bounds: [0, 0, 0, 1, 1, 1] // Default bounds if not provided
      }
    };

    console.log('Mesh data validated:', {
      vertices: cgnsData.mesh.vertices.length,
      elements: cgnsData.mesh.elements.length
    });

    // Convert solutions to Float32Arrays if present
    if (Array.isArray(response.solutions)) {
      response.solutions.forEach((solution, index) => {
        const processedSolution: { [key: string]: Float32Array } = {};
        
        Object.entries(solution).forEach(([key, value]) => {
          if (key !== 'min' && key !== 'max' && Array.isArray(value)) {
            processedSolution[key] = new Float32Array(value);
          }
        });
        
        cgnsData.solutions.push(processedSolution);
      });

      console.log('Processed solutions:', cgnsData.solutions.length);
    }
    
    return cgnsData;
  } catch (error) {
    console.error('Error processing CGNS data:', error);
    throw error;
  }
};