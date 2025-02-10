import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import styled from 'styled-components';

const ViewerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  overflow: hidden;
`;

const ControlPanel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.98);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  width: 280px;
  backdrop-filter: blur(10px);
`;

const ControlGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background: white;
  color: #2c3e50;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #0366d6;
  }

  &:focus {
    outline: none;
    border-color: #0366d6;
    box-shadow: 0 0 0 2px rgba(3, 102, 214, 0.2);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0;
`;

const Checkbox = styled.input`
  margin-right: 8px;
  cursor: pointer;
  width: 16px;
  height: 16px;
`;

const CheckboxLabel = styled.span`
  font-size: 14px;
  color: #2c3e50;
  user-select: none;
`;

const PanelTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
`;

const ColorSchemeOption = styled.option`
  padding: 8px;
`;

interface AirfoilViewerProps {
  data: {
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
  };
}

interface ViewerSettings {
  showGrid: boolean;
  showAxes: boolean;
  colorScheme: 'rainbow' | 'thermal' | 'grayscale';
  wireframe: boolean;
  autoRotate: boolean;
}

const AirfoilViewer: React.FC<AirfoilViewerProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeField, setActiveField] = useState<keyof typeof simulationData>('pressure');
  const [settings, setSettings] = useState<ViewerSettings>({
    showGrid: true,
    showAxes: true,
    colorScheme: 'rainbow',
    wireframe: false,
    autoRotate: false
  });

  const [scene] = useState(() => new THREE.Scene());
  const [camera] = useState(() => new THREE.PerspectiveCamera(75, 1, 0.1, 1000));
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
  const [gridHelper, setGridHelper] = useState<THREE.GridHelper | null>(null);
  const [axesHelper, setAxesHelper] = useState<THREE.AxesHelper | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Setup renderer
    const newRenderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    newRenderer.setPixelRatio(window.devicePixelRatio);
    newRenderer.setClearColor(0xf8f9fa);
    containerRef.current.appendChild(newRenderer.domElement);
    setRenderer(newRenderer);

    // Setup camera
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    // Setup controls
    const newControls = new OrbitControls(camera, newRenderer.domElement);
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;
    newControls.minDistance = 1;
    newControls.maxDistance = 10;
    setControls(newControls);

    // Setup grid helper
    const grid = new THREE.GridHelper(10, 20, 0x666666, 0x999999);
    scene.add(grid);
    setGridHelper(grid);

    // Setup axes helper
    const axes = new THREE.AxesHelper(5);
    scene.add(axes);
    setAxesHelper(axes);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add hemisphere light for better ambient lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemiLight);

    // Cleanup function
    return () => {
      newRenderer.dispose();
      containerRef.current?.removeChild(newRenderer.domElement);
      scene.remove(grid);
      scene.remove(axes);
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    if (!containerRef.current || !renderer || !camera) return;

    const handleResize = () => {
      const width = containerRef.current!.clientWidth;
      const height = containerRef.current!.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [renderer, camera]);

  // Update settings
  useEffect(() => {
    if (!gridHelper || !axesHelper || !mesh || !controls) return;

    gridHelper.visible = settings.showGrid;
    axesHelper.visible = settings.showAxes;
    controls.autoRotate = settings.autoRotate;
    
    if (mesh) {
      const material = mesh.material as THREE.MeshPhongMaterial;
      material.wireframe = settings.wireframe;
    }
  }, [settings, gridHelper, axesHelper, mesh, controls]);

  // Color mapping functions
  const getColorMap = (value: number, min: number, max: number) => {
    const normalized = (value - min) / (max - min);
    
    switch (settings.colorScheme) {
      case 'thermal':
        return new THREE.Color().setHSL(0.6 * (1 - normalized), 1, 0.5);
      case 'grayscale':
        return new THREE.Color(normalized, normalized, normalized);
      case 'rainbow':
      default:
        return new THREE.Color().setHSL(normalized * 0.8, 1, 0.5);
    }
  };

  // Update geometry
  useEffect(() => {
    if (!data || !data.mesh || !data.mesh.vertices || !data.mesh.elements) {
      console.log('No mesh data available');
      return;
    }

    console.log('Creating geometry with:', {
      vertices: data.mesh.vertices.length,
      elements: data.mesh.elements.length
    });

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    
    // Add vertices
    const vertices = new Float32Array(data.mesh.vertices.flat());
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Add faces
    const indices = new Uint32Array(data.mesh.elements.flat());
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // Calculate normals
    geometry.computeVertexNormals();

    // Create material
    const material = new THREE.MeshPhongMaterial({
      color: 0x156289,
      side: THREE.DoubleSide,
      flatShading: false,
      shininess: 50,
      vertexColors: true
    });

    // Create mesh
    const newMesh = new THREE.Mesh(geometry, material);
    
    // Center the mesh
    geometry.computeBoundingSphere();
    if (geometry.boundingSphere) {
      const center = geometry.boundingSphere.center;
      newMesh.position.set(-center.x, -center.y, -center.z);
    }
    
    scene.add(newMesh);
    setMesh(newMesh);

    // Set camera position based on bounding sphere
    if (geometry.boundingSphere) {
      const radius = geometry.boundingSphere.radius;
      camera.position.set(radius * 2, radius * 2, radius * 2);
      camera.lookAt(0, 0, 0);
      
      // Update controls
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.minDistance = radius * 0.5;
        controls.maxDistance = radius * 5;
        controls.update();
      }
    }

    return () => {
      scene.remove(newMesh);
      geometry.dispose();
      material.dispose();
    };
  }, [data, scene, camera, controls]);

  // Update simulation data visualization
  useEffect(() => {
    if (!mesh || !data || !data.solutions) {
      console.log('No mesh or solution data available');
      return;
    }

    const solution = data.solutions.find(sol => Object.keys(sol)[0] === activeField);
    if (!solution) {
      console.log('No solution found for field:', activeField);
      return;
    }

    const values = solution[activeField];
    const colors = new Float32Array(values.length * 3);
    const minVal = solution.min;
    const maxVal = solution.max;

    console.log(`Updating colors for field ${activeField}:`, {
      min: minVal,
      max: maxVal,
      points: values.length
    });

    for (let i = 0; i < values.length; i++) {
      const color = getColorMap(values[i], minVal, maxVal);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = mesh.geometry;
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = mesh.material as THREE.MeshPhongMaterial;
    material.vertexColors = true;
    material.needsUpdate = true;
    material.vertexColors = true;
    material.needsUpdate = true;
  }, [simulationData, activeField, mesh, settings.colorScheme]);

  // Animation loop
  useEffect(() => {
    if (!renderer || !scene || !camera || !controls) return;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
  }, [renderer, scene, camera, controls]);

  return (
    <ViewerContainer ref={containerRef}>
      <ControlPanel>
        <PanelTitle>Visualization Controls</PanelTitle>
        
        <ControlGroup>
          <Label>Data Field</Label>
          <Select 
            value={activeField} 
            onChange={(e) => setActiveField(e.target.value as keyof typeof simulationData)}
          >
            {Object.keys(simulationData).map((field) => (
              <option key={field} value={field}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </option>
            ))}
          </Select>
        </ControlGroup>

        <ControlGroup>
          <Label>Color Scheme</Label>
          <Select
            value={settings.colorScheme}
            onChange={(e) => setSettings(prev => ({ 
              ...prev, 
              colorScheme: e.target.value as ViewerSettings['colorScheme'] 
            }))}
          >
            <ColorSchemeOption value="rainbow">Rainbow</ColorSchemeOption>
            <ColorSchemeOption value="thermal">Thermal</ColorSchemeOption>
            <ColorSchemeOption value="grayscale">Grayscale</ColorSchemeOption>
          </Select>
        </ControlGroup>

        <ControlGroup>
          <Label>Display Options</Label>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={settings.showGrid}
              onChange={(e) => setSettings(prev => ({ ...prev, showGrid: e.target.checked }))}
            />
            <CheckboxLabel>Show Grid</CheckboxLabel>
          </CheckboxContainer>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={settings.showAxes}
              onChange={(e) => setSettings(prev => ({ ...prev, showAxes: e.target.checked }))}
            />
            <CheckboxLabel>Show Axes</CheckboxLabel>
          </CheckboxContainer>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={settings.wireframe}
              onChange={(e) => setSettings(prev => ({ ...prev, wireframe: e.target.checked }))}
            />
            <CheckboxLabel>Wireframe Mode</CheckboxLabel>
          </CheckboxContainer>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={settings.autoRotate}
              onChange={(e) => setSettings(prev => ({ ...prev, autoRotate: e.target.checked }))}
            />
            <CheckboxLabel>Auto-Rotate</CheckboxLabel>
          </CheckboxContainer>
        </ControlGroup>
      </ControlPanel>
    </ViewerContainer>
  );
};

export default AirfoilViewer;