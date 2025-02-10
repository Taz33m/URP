export function generateTestCGNSFile(): ArrayBuffer {
  // Create an ArrayBuffer to hold our test CGNS data
  const bufferSize = 1024 * 1024; // 1MB should be enough for our test
  const buffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(buffer);
  let offset = 0;

  // Write magic number "CGNS"
  const encoder = new TextEncoder();
  const magicBytes = encoder.encode('CGNS');
  new Uint8Array(buffer, offset, 4).set(magicBytes);
  offset += 4;

  // Write version (3.1)
  dataView.setFloat64(offset, 3.1, true);
  offset += 8;

  // Write simulation name
  const simName = 'TestAirfoil';
  dataView.setInt32(offset, simName.length, true);
  offset += 4;
  new Uint8Array(buffer, offset, simName.length).set(encoder.encode(simName));
  offset += simName.length;

  // Write date
  const date = new Date().toISOString();
  new Uint8Array(buffer, offset, 24).set(encoder.encode(date.padEnd(24, '\0')));
  offset += 24;

  // Generate test vertices (simple airfoil shape)
  const vertexCount = 100;
  const vertices: number[][] = [];
  
  // Generate NACA 0012 airfoil points
  for (let i = 0; i < vertexCount; i++) {
    const x = i / (vertexCount - 1);
    const t = 0.12; // thickness
    const y = t * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4);
    vertices.push([x - 0.5, y, 0]); // Upper surface
    vertices.push([x - 0.5, -y, 0]); // Lower surface
  }

  // Write vertex count
  dataView.setInt32(offset, vertices.length, true);
  offset += 4;

  // Write vertices
  vertices.forEach(vertex => {
    vertex.forEach(coord => {
      dataView.setFloat64(offset, coord, true);
      offset += 8;
    });
  });

  // Write elements (triangles connecting vertices)
  const elements: number[][] = [];
  for (let i = 0; i < vertexCount - 1; i++) {
    elements.push([i * 2, (i + 1) * 2, i * 2 + 1]); // Upper triangle
    elements.push([(i + 1) * 2, (i + 1) * 2 + 1, i * 2 + 1]); // Lower triangle
  }

  // Write element count
  dataView.setInt32(offset, elements.length, true);
  offset += 4;

  // Write elements
  elements.forEach(element => {
    dataView.setInt32(offset, element.length, true);
    offset += 4;
    element.forEach(index => {
      dataView.setInt32(offset, index, true);
      offset += 4;
    });
  });

  // Write boundary conditions
  const boundaries: Record<string, number[]> = {
    'leading_edge': [0, 1],
    'trailing_edge': [vertexCount * 2 - 2, vertexCount * 2 - 1],
  };

  dataView.setInt32(offset, Object.keys(boundaries).length, true);
  offset += 4;

  Object.entries(boundaries).forEach(([name, indices]) => {
    dataView.setInt32(offset, name.length, true);
    offset += 4;
    new Uint8Array(buffer, offset, name.length).set(encoder.encode(name));
    offset += name.length;
    
    dataView.setInt32(offset, indices.length, true);
    offset += 4;
    indices.forEach(index => {
      dataView.setInt32(offset, index, true);
      offset += 4;
    });
  });

  // Write solution data
  const solutionCount = 1;
  dataView.setInt32(offset, solutionCount, true);
  offset += 4;

  // Generate one solution timestep
  dataView.setFloat64(offset, 0.0, true); // timeStep
  offset += 8;

  // Generate solution data for each vertex
  for (let i = 0; i < vertices.length; i++) {
    // Pressure (simple distribution based on y coordinate)
    dataView.setFloat64(offset, 101325 + vertices[i][1] * 1000, true);
    offset += 8;

    // Density (constant)
    dataView.setFloat64(offset, 1.225, true);
    offset += 8;

    // Temperature (constant)
    dataView.setFloat64(offset, 288.15, true);
    offset += 8;

    // Velocity (simple flow field)
    dataView.setFloat64(offset, 100.0, true); // Vx
    offset += 8;
    dataView.setFloat64(offset, vertices[i][1] * 10, true); // Vy
    offset += 8;
    dataView.setFloat64(offset, 0.0, true); // Vz
    offset += 8;
  }

  return buffer.slice(0, offset);
} 