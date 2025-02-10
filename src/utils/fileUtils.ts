interface CGNSData {
  mesh?: {
    vertices: number[][];
    faces: number[][];
  };
  pointData?: Record<string, number[]>;
}

// Browser-compatible file utilities
export const readCGNSFiles = async (): Promise<string[]> => {
  try {
    const response = await fetch('http://localhost:8000/api/cgns/files');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error('Error reading CGNS files:', err);
    return [];
  }
};

export const readCGNSFile = async (filename: string): Promise<CGNSData> => {
  try {
    const response = await fetch(`http://localhost:8000/api/cgns/${filename}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      mesh: {
        vertices: data.mesh?.vertices || [],
        faces: data.mesh?.faces || []
      },
      pointData: data.pointData || {}
    };
  } catch (err) {
    console.error('Error reading CGNS file:', err);
    throw err;
  }
};
