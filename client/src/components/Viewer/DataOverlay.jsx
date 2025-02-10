import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const DataOverlay = ({ 
  scene, 
  simulationData, 
  colorMap = 'rainbow',
  dataField = 'pressure',
  visible = true 
}) => {
  const colorMaps = useMemo(() => ({
    rainbow: (value) => new THREE.Color().setHSL(value, 1, 0.5),
    viridis: (value) => {
      // Simplified viridis implementation
      return new THREE.Color(
        0.267004 + 0.004874 * value,
        0.004874 + 0.879074 * value,
        0.329415 + 0.879074 * (1 - value)
      );
    },
    plasma: (value) => {
      // Simplified plasma implementation
      return new THREE.Color(
        0.241761 + 0.983158 * value,
        0.023624 + 0.564011 * value,
        0.329415 + 0.792081 * (1 - value)
      );
    },
    grayscale: (value) => new THREE.Color(value, value, value),
  }), []);

  useEffect(() => {
    if (!scene || !simulationData) return;

    // Clear existing overlay
    const existingOverlay = scene.getObjectByName('dataOverlay');
    if (existingOverlay) {
      scene.remove(existingOverlay);
    }

    if (!visible) return;

    // Create new overlay
    const overlayGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(simulationData.positions);
    const values = new Float32Array(simulationData[dataField]);

    overlayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Normalize values for color mapping
    const min = Math.min(...values);
    const max = Math.max(...values);
    const normalizedValues = values.map(v => (v - min) / (max - min));
    
    // Apply color map
    const colors = new Float32Array(normalizedValues.length * 3);
    normalizedValues.forEach((value, i) => {
      const color = colorMaps[colorMap](value);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    overlayGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.01,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const overlay = new THREE.Points(overlayGeometry, material);
    overlay.name = 'dataOverlay';
    scene.add(overlay);

    return () => {
      scene.remove(overlay);
    };
  }, [scene, simulationData, colorMap, dataField, visible, colorMaps]);

  return null; // This is a purely functional component
};

export default DataOverlay; 