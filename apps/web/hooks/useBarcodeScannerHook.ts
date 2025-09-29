/**
 * Code Slice 5: Barcode Scanning
 * React hook for barcode scanning functionality (ZXing powered)
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  requestCameraPermission,
  startCameraStream,
  stopCameraStream,
  CameraPermissionStatus,
} from '@/lib/utils/cameraPermissions';
import { normalizeUnlockCode } from '@/lib/utils/codeGenerator';
import type { Result, Exception, DecodeHintType } from '@zxing/library';
import type { IScannerControls } from '@zxing/browser/esm/common/IScannerControls';
import type { DecodeContinuouslyCallback } from '@zxing/browser/esm/common/DecodeContinuouslyCallback';

type BrowserMultiFormatReader = import('@zxing/browser').BrowserMultiFormatReader;

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
  startScanning: (videoElement?: HTMLVideoElement | null) => Promise<void>;
  stopScanning: () => void;
  requestPermissions: () => Promise<boolean>;
  clearError: () => void;
  clearResult: () => void;
}

async function loadZXingReader(): Promise<BrowserMultiFormatReader> {
  const [{ BrowserMultiFormatReader }, library] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);

  const hints = new Map<DecodeHintType, unknown>();
  hints.set(library.DecodeHintType.POSSIBLE_FORMATS, [
    library.BarcodeFormat.QR_CODE,
    library.BarcodeFormat.CODE_128,
  ]);
  hints.set(library.DecodeHintType.TRY_HARDER, true);

  const reader = new BrowserMultiFormatReader(hints);
  reader.setHints(hints);

  return reader;
}

const ZXING_ERROR_MESSAGE = 'Unable to start the camera scanner. Please try again or enter the code manually.';

export function useBarcodeScannerHook(): BarcodeScannerState & BarcodeScannerActions {
  const [state, setState] = useState<BarcodeScannerState>({
    isScanning: false,
    hasPermission: false,
    permissionStatus: null,
    error: null,
    isLoading: false,
    stream: null,
    lastResult: null,
  });

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanningActiveRef = useRef(false);

  const setErrorState = useCallback((message: string | null) => {
    setState((prev) => ({ ...prev, error: message }));
  }, []);

  const cleanupStream = useCallback(() => {
    controlsRef.current?.stop?.();
    controlsRef.current = null;

    const reader = readerRef.current as { reset?: () => void } | null;
    reader?.reset?.();
    readerRef.current = null;

    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }

    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      scanningActiveRef.current = false;
      cleanupStream();
    };
  }, [cleanupStream]);

  const requestPermissions = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const permissionStatus = await requestCameraPermission();
      setState((prev) => ({
        ...prev,
        permissionStatus,
        hasPermission: permissionStatus.granted,
        error: permissionStatus.error ?? null,
        isLoading: false,
      }));
      return permissionStatus.granted;
    } catch (error) {
      console.error('Failed to request camera permissions', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to request camera permissions',
        isLoading: false,
        hasPermission: false,
      }));
      return false;
    }
  }, []);

  const handleDecode = useCallback<DecodeContinuouslyCallback>(
    (result: Result | undefined, err: Exception | undefined, controls: IScannerControls) => {
      if (!scanningActiveRef.current) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;

      if (result) {
        const normalized = normalizeUnlockCode(result.getText());
        scanningActiveRef.current = false;
        controls.stop();
        cleanupStream();
        setState((prev) => ({
          ...prev,
          lastResult: {
            code: normalized,
            format: result.getBarcodeFormat()?.toString() ?? 'UNKNOWN',
            timestamp: Date.now(),
          },
          isScanning: false,
          stream: null,
        }));
        return;
      }

      if (err && err.name !== 'NotFoundException') {
        console.error('Barcode detection error', err);
        setErrorState('Unable to read the barcode. Adjust lighting and try again.');
      }
    },
    [cleanupStream, setErrorState],
  );

  const startScanning = useCallback<BarcodeScannerActions['startScanning']>(
    async (videoElement) => {
      const targetVideo = videoElement ?? videoElementRef.current;
      if (!targetVideo) {
        setErrorState('Camera preview is not ready yet.');
        return;
      }

      const hasPermission = state.hasPermission || (await requestPermissions());
      if (!hasPermission) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        scanningActiveRef.current = false;
        cleanupStream();

        const stream = await startCameraStream();
        streamRef.current = stream;
        videoElementRef.current = targetVideo;
        targetVideo.srcObject = stream;
        await targetVideo.play();

        const reader = await loadZXingReader();
        readerRef.current = reader;
        scanningActiveRef.current = true;

        const controls = await reader.decodeFromVideoElement(targetVideo, (result, error, ctrl) => {
          handleDecode(result, error, ctrl);
        });

        controlsRef.current = controls;
        setState((prev) => ({ ...prev, stream, isScanning: true, isLoading: false }));
      } catch (error) {
        console.error('Failed to start camera scanning', error);
        cleanupStream();
        setState((prev) => ({
          ...prev,
          isScanning: false,
          isLoading: false,
          stream: null,
          error: ZXING_ERROR_MESSAGE,
        }));
      }
    },
    [cleanupStream, handleDecode, requestPermissions, setErrorState, state.hasPermission],
  );

  const stopScanning = useCallback(() => {
    scanningActiveRef.current = false;
    cleanupStream();
    setState((prev) => ({ ...prev, isScanning: false, stream: null }));
  }, [cleanupStream]);

  const clearError = useCallback(() => setErrorState(null), [setErrorState]);

  const clearResult = useCallback(() => {
    setState((prev) => ({ ...prev, lastResult: null }));
  }, []);

  return {
    ...state,
    startScanning,
    stopScanning,
    requestPermissions,
    clearError,
    clearResult,
  };
}
