interface CGNSResponse {
  mesh: {
    vertices: number[][];
    elements: number[][];
  };
  solutions: Array<{
    [fieldName: string]: number[];
    min: number;
    max: number;
  }>;
  stats: {
    n_points: number;
    n_faces: number;
    bounds: number[];
  };
}

export const fetchCGNSData = async (filename: string): Promise<CGNSResponse> => {
  try {
    const response = await fetch(`/api/cgns/${filename}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch CGNS data');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching CGNS data:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred');
  }
};

export const listCGNSFiles = async (): Promise<string[]> => {
  try {
    const response = await fetch('/api/cgns/files');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch CGNS file list');
    }
    
    return data.files;
  } catch (error) {
    console.error('Error fetching CGNS file list:', error);
    throw error instanceof Error ? error : new Error('An unknown error occurred');
  }
};
