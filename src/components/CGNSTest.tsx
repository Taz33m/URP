import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Box, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Paper, Select, Checkbox, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const ControlPanel = styled(Paper)({
  padding: '16px',
  position: 'absolute',
  top: '16px',
  left: '16px',
  zIndex: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  maxWidth: '300px'
});

const ViewerContainer = styled('div')({
  flex: 1,
  height: '100vh',
  position: 'relative',
  backgroundColor: '#1a1a1a'
});

const Overlay = styled('div')({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'white',
  fontSize: '20px',
  zIndex: 2,
  textAlign: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  padding: '20px',
  borderRadius: '8px',
  maxWidth: '80%'
});

import { processCGNSData } from '../services/cgnsProcessor';

interface CGNSTestProps {
  selectedFile: string | null;
}

const CGNSTest: React.FC<CGNSTestProps> = ({ selectedFile }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scene] = useState(new THREE.Scene());
  const [renderer] = useState(new THREE.WebGLRenderer({ antialias: true }));
  const [camera] = useState(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [dataField, setDataField] = useState<string>('');
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const initScene = () => {
    if (!containerRef.current) return;

    // Setup renderer
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x1a1a1a);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Setup camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const frustumSize = 100;
    camera.left = -frustumSize * aspect;
    camera.right = frustumSize * aspect;
    camera.top = frustumSize;
    camera.bottom = -frustumSize;
    camera.position.set(100, 100, 100);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    // Setup controls
    const newControls = new OrbitControls(camera, renderer.domElement);
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;
    setControls(newControls);

    // Add grid
    const grid = new THREE.GridHelper(200, 20, 0x555555, 0x282828);
    grid.name = 'grid';
    scene.add(grid);

    // Add axes
    const axes = new THREE.AxesHelper(100);
    axes.name = 'axes';
    scene.add(axes);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    animate();
  };

  const animate = () => {
    requestAnimationFrame(animate);
    if (controls) {
      controls.update();
    }
    renderer.render(scene, camera);
  };

  const loadCGNSData = async (filename: string) => {
    try {
      console.log('Loading CGNS file:', filename);
      setLoading(true);
      setError(null);
      
      if (!filename) {
        throw new Error('No file selected');
      }
      
      const data = await processCGNSData(filename);
      console.log('Processed CGNS data:', data);
      
      if (!data || !data.mesh) {
        throw new Error('Invalid data received from server');
      }
      
      // Clear existing mesh
      const existingMesh = scene.getObjectByName('cgnsMesh');
      if (existingMesh) {
        console.log('Removing existing mesh');
        scene.remove(existingMesh);
      }

      // Create geometry
      const geometry = new THREE.BufferGeometry();
      
      // Validate mesh data
      if (!Array.isArray(data.mesh.vertices) || !Array.isArray(data.mesh.elements)) {
        throw new Error('Invalid mesh data: vertices or elements are not arrays');
      }
      
      console.log('Vertices:', data.mesh.vertices.length, 'Elements:', data.mesh.elements.length);
      
      // Set vertices
      const vertices = new Float32Array(data.mesh.vertices.flat());
      console.log('Vertex buffer size:', vertices.length);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

      // Set faces
      const indices = new Uint32Array(data.mesh.elements.flat());
      console.log('Index buffer size:', indices.length);
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));

      // Calculate normals
      geometry.computeVertexNormals();

      // Create material
      const material = new THREE.MeshPhongMaterial({
        color: 0x00aaff,
        side: THREE.DoubleSide,
        wireframe: wireframeMode,
        flatShading: true,
        shininess: 30
      });

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = 'cgnsMesh';
      scene.add(mesh);
      meshRef.current = mesh;

      // Update camera based on mesh bounds
      if (data.stats && data.stats.bounds) {
        const bounds = data.stats.bounds;
        const center = new THREE.Vector3(
          (bounds[0] + bounds[1]) / 2,
          (bounds[2] + bounds[3]) / 2,
          (bounds[4] + bounds[5]) / 2
        );
        
        const size = new THREE.Vector3(
          bounds[1] - bounds[0],
          bounds[3] - bounds[2],
          bounds[5] - bounds[4]
        );
        
        // Adjust camera to fit mesh
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(
          center.x + maxDim * 2,
          center.y + maxDim * 2,
          center.z + maxDim * 2
        );
        camera.lookAt(center);
        
        if (controls) {
          controls.target.copy(center);
          controls.update();
        }
      }
      
      // Update available fields from solutions
      if (data.solutions && data.solutions.length > 0) {
        const fields = Object.keys(data.solutions[0]).filter(key => key !== 'min' && key !== 'max');
        console.log('Available fields:', fields);
        setAvailableFields(fields);
        if (fields.length > 0) {
          setDataField(fields[0]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading CGNS data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load mesh');
      setLoading(false);
    }
  };

  // Initialize scene and handle cleanup
  useEffect(() => {
    initScene();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      const frustumSize = 100;
      
      camera.left = -frustumSize * aspect;
      camera.right = frustumSize * aspect;
      camera.top = frustumSize;
      camera.bottom = -frustumSize;
      camera.updateProjectionMatrix();
      
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
      if (controls) {
        controls.dispose();
      }
    };
  }, []);

  // Handle file selection
  useEffect(() => {
    if (selectedFile) {
      loadCGNSData(selectedFile);
    }
  }, [selectedFile]);

  // Handle grid visibility
  useEffect(() => {
    const grid = scene.getObjectByName('grid');
    if (grid) grid.visible = showGrid;
  }, [showGrid]);

  // Handle axes visibility
  useEffect(() => {
    const axes = scene.getObjectByName('axes');
    if (axes) axes.visible = showAxes;
  }, [showAxes]);

  // Handle wireframe mode
  useEffect(() => {
    const mesh = scene.getObjectByName('cgnsMesh');
    if (mesh && mesh instanceof THREE.Mesh) {
      (mesh.material as THREE.MeshPhongMaterial).wireframe = wireframeMode;
    }
  }, [wireframeMode]);

  // Handle auto-rotation
  useEffect(() => {
    if (controls) {
      controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  return (
    <ViewerContainer ref={containerRef}>
      {loading && (
        <Overlay>Loading CGNS mesh...</Overlay>
      )}
      {error && (
        <Overlay
          style={{
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            border: '1px solid #ff4444',
            maxWidth: '400px'
          }}
        >
          <Typography variant="h6" style={{ marginBottom: '8px', color: '#ffffff' }}>
            Error Loading Mesh
          </Typography>
          <Typography style={{ color: '#ffffff' }}>{error}</Typography>
        </Overlay>
      )}
      <ControlPanel elevation={3}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              CGNS Viewer
            </Typography>
          </Grid>
          
          {availableFields.length > 0 && (
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Data Field</InputLabel>
                <Select
                  value={dataField}
                  onChange={(e) => setDataField(e.target.value as string)}
                  label="Data Field"
                >
                  {availableFields.map((field) => (
                    <MenuItem key={field} value={field}>
                      {field}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Display Options
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />}
              label="Show Grid"
            />
            <FormControlLabel
              control={<Checkbox checked={showAxes} onChange={(e) => setShowAxes(e.target.checked)} />}
              label="Show Axes"
            />
            <FormControlLabel
              control={<Checkbox checked={wireframeMode} onChange={(e) => setWireframeMode(e.target.checked)} />}
              label="Wireframe Mode"
            />
            <FormControlLabel
              control={<Checkbox checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />}
              label="Auto-Rotate"
            />
          </Grid>
        </Grid>
      </ControlPanel>
    </ViewerContainer>
  );
};

export default CGNSTest;