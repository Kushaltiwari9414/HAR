
import { useState, useEffect, useRef, useCallback } from 'react';
import { SensorData, ProcessedFeatures } from '../types';

const SAMPLE_RATE_MS = 50; // ~20Hz
const MAX_BUFFER_SIZE = 100; // 5 seconds of data at 20Hz (100 * 50ms = 5000ms)

interface UseSensorsReturn {
  isRecording: boolean;
  hasSensors: boolean;
  permissionGranted: boolean;
  currentData: SensorData;
  startRecording: () => void;
  stopRecording: () => void;
  requestPermissions: () => Promise<void>;
  getFeatures: () => ProcessedFeatures | null;
  toggleSimulation: () => void;
  isSimulating: boolean;
}

export const useSensors = (): UseSensorsReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [hasSensors, setHasSensors] = useState(true); // Optimistic default
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Immediate display data (for graphs)
  const [currentData, setCurrentData] = useState<SensorData>({ x: 0, y: 0, z: 0, alpha: 0, beta: 0, gamma: 0, timestamp: 0 });

  // Buffer for AI processing (Sliding Window)
  const bufferRef = useRef<SensorData[]>([]);

  // Simulation interval ref
  const simulationRef = useRef<number | null>(null);

  const processBuffer = useCallback((): ProcessedFeatures | null => {
    const data = bufferRef.current;

    // Wait until we have at least 2 seconds of data (40 samples) to start predicting
    if (data.length < 40) return null;

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr: number[], meanVal: number) => Math.sqrt(arr.map(x => Math.pow(x - meanVal, 2)).reduce((a, b) => a + b, 0) / arr.length);

    // Extract Arrays
    const accX = data.map(d => d.x);
    const accY = data.map(d => d.y);
    const accZ = data.map(d => d.z);
    const gyroA = data.map(d => d.alpha);
    const gyroB = data.map(d => d.beta);
    const gyroG = data.map(d => d.gamma);

    // Calculate Means
    const xMean = mean(accX);
    const yMean = mean(accY);
    const zMean = mean(accZ);
    const aMean = mean(gyroA);
    const bMean = mean(gyroB);
    const gMean = mean(gyroG);

    const features: ProcessedFeatures = {
      acc_x_mean: xMean,
      acc_x_std: std(accX, xMean),
      acc_y_mean: yMean,
      acc_y_std: std(accY, yMean),
      acc_z_mean: zMean,
      acc_z_std: std(accZ, zMean),
      
      gyro_alpha_mean: aMean,
      gyro_alpha_std: std(gyroA, aMean),
      gyro_beta_mean: bMean,
      gyro_beta_std: std(gyroB, bMean),
      gyro_gamma_mean: gMean,
      gyro_gamma_std: std(gyroG, gMean),
    };

    return features;
  }, []);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const timestamp = Date.now();
    
    // Accelerometer
    const { x, y, z } = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
    const cleanX = x || 0;
    const cleanY = y || 0;
    const cleanZ = z || 0;
    
    // Gyroscope
    const { alpha, beta, gamma } = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
    const cleanAlpha = alpha || 0;
    const cleanBeta = beta || 0;
    const cleanGamma = gamma || 0;

    const newData: SensorData = { 
        x: cleanX, 
        y: cleanY, 
        z: cleanZ, 
        alpha: cleanAlpha,
        beta: cleanBeta,
        gamma: cleanGamma,
        timestamp 
    };

    setCurrentData(newData);

    if (isRecording) {
      bufferRef.current.push(newData);
      
      // Sliding Window: Remove oldest data if buffer exceeds max size
      if (bufferRef.current.length > MAX_BUFFER_SIZE) {
        bufferRef.current.shift();
      }
    }
  }, [isRecording]);

  const startRecording = () => setIsRecording(true);
  const stopRecording = () => {
    setIsRecording(false);
    bufferRef.current = []; // Clear on stop
  };

  const requestPermissions = async () => {
    // iOS 13+ requirement
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
        } else {
          console.warn("Permission denied");
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Non-iOS or older devices
      setPermissionGranted(true);
    }
  };

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
    setIsRecording(false); // Reset recording state when toggling mode
    bufferRef.current = [];
  };

  // Simulation Effect
  useEffect(() => {
    if (isSimulating) {
        // Simulate walking/running data
        let tick = 0;
        simulationRef.current = window.setInterval(() => {
            tick += 0.2;
            
            // Accelerometer Simulation (Walking bobbing)
            const simX = Math.sin(tick) * 3 + (Math.random() - 0.5); 
            const simY = Math.cos(tick) * 5 + 9.8 + (Math.random() - 0.5); 
            const simZ = Math.sin(tick * 0.5) * 2;
            
            // Gyroscope Simulation (Hip sway / device rotation)
            const simAlpha = Math.sin(tick * 0.5) * 10; // Yaw
            const simBeta = Math.cos(tick) * 20;        // Pitch
            const simGamma = Math.sin(tick) * 5;        // Roll
            
            const event = {
                accelerationIncludingGravity: { x: simX, y: simY, z: simZ },
                rotationRate: { alpha: simAlpha, beta: simBeta, gamma: simGamma }
            } as DeviceMotionEvent;

            handleMotion(event);
        }, SAMPLE_RATE_MS);
    } else {
        if (simulationRef.current) clearInterval(simulationRef.current);
    }
    return () => {
        if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [isSimulating, handleMotion]);

  // Real Sensor Effect
  useEffect(() => {
    if (permissionGranted && !isSimulating) {
      window.addEventListener('devicemotion', handleMotion);
      return () => {
        window.removeEventListener('devicemotion', handleMotion);
      };
    }
  }, [permissionGranted, isSimulating, handleMotion]);

  // Check for sensor support on mount
  useEffect(() => {
    if (!window.DeviceMotionEvent) {
      setHasSensors(false);
    }
  }, []);

  return {
    isRecording,
    hasSensors,
    permissionGranted,
    currentData,
    startRecording,
    stopRecording,
    requestPermissions,
    getFeatures: processBuffer,
    toggleSimulation,
    isSimulating
  };
};
