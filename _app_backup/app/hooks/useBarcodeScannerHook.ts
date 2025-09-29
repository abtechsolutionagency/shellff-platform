
/**
 * Code Slice 5: Barcode Scanning
 * React hook for barcode scanning functionality
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  requestCameraPermission, 
  startCameraStream, 
  stopCameraStream,
  CameraPermissionStatus 
} from '@/lib/utils/cameraPermissions';

export interface ScanResult {
  code: string;
  format: string;
  timestamp: number;
}

export interface BarcodeScannerState {
  isScanning: boolean;
  hasPermission: boolean;
  permissionStatus: CameraPermissionStatus | null;
  error: string | null;
  isLoading: boolean;
  stream: MediaStream | null;
  lastResult: ScanResult | null;
}

export interface BarcodeScannerActions {
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  requestPermissions: () => Promise<void>;
  clearError: () => void;
  clearResult: () => void;
}

// Mock barcode detection for development
// In production, this would use a library like @zxing/library or html5-qrcode
function mockBarcodeDetection(videoElement: HTMLVideoElement): Promise<string | null> {
  return new Promise((resolve) => {
    // Simulate barcode detection delay
    setTimeout(() => {
      // In a real implementation, this would analyze the video frame
      // For demo purposes, we'll randomly "detect" a code
      const shouldDetect = Math.random() > 0.7; // 30% chance of detection per attempt
      if (shouldDetect) {
        resolve('SH1234'); // Mock detected code
      } else {
        resolve(null);
      }
    }, 1000);
  });
}

export function useBarcodeScannerHook(): BarcodeScannerState & BarcodeScannerActions {
  const [state, setState] = useState<BarcodeScannerState>({
    isScanning: false,
    hasPermission: false,
    permissionStatus: null,
    error: null,
    isLoading: false,
    stream: null,
    lastResult: null
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (state.stream) {
        stopCameraStream(state.stream);
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [state.stream]);

  const requestPermissions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permissionStatus = await requestCameraPermission();
      setState(prev => ({
        ...prev,
        permissionStatus,
        hasPermission: permissionStatus.granted,
        error: permissionStatus.error || null,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to request camera permissions',
        isLoading: false,
        hasPermission: false
      }));
    }
  }, []);

  const startScanning = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permissions if not granted
      if (!state.hasPermission) {
        await requestPermissions();
        return;
      }

      // Start camera stream
      const stream = await startCameraStream();
      
      setState(prev => ({
        ...prev,
        stream,
        isScanning: true,
        isLoading: false
      }));

      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Start barcode detection loop
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const detectedCode = await mockBarcodeDetection(videoRef.current);
              if (detectedCode) {
                const result: ScanResult = {
                  code: detectedCode,
                  format: 'QR_CODE',
                  timestamp: Date.now()
                };

                setState(prev => ({
                  ...prev,
                  lastResult: result,
                  isScanning: false
                }));

                // Stop scanning after successful detection
                if (scanIntervalRef.current) {
                  clearInterval(scanIntervalRef.current);
                  scanIntervalRef.current = null;
                }
              }
            } catch (error) {
              console.error('Barcode detection error:', error);
            }
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Failed to start scanning:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to start camera scanning',
        isLoading: false,
        isScanning: false
      }));
    }
  }, [state.hasPermission, requestPermissions]);

  const stopScanning = useCallback(() => {
    // Clear scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop camera stream
    if (state.stream) {
      stopCameraStream(state.stream);
    }

    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState(prev => ({
      ...prev,
      isScanning: false,
      stream: null
    }));
  }, [state.stream]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, lastResult: null }));
  }, []);

  return {
    ...state,
    startScanning,
    stopScanning,
    requestPermissions,
    clearError,
    clearResult
  };
}
