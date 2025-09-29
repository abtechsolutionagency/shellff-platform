
/**
 * Code Slice 5: Barcode Scanning
 * Camera permissions and device access utilities
 */

export interface CameraPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  error?: string;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
}

/**
 * Check if camera permissions are supported in the current browser
 */
export function isCameraSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Request camera permissions from the user
 */
export async function requestCameraPermission(): Promise<CameraPermissionStatus> {
  if (!isCameraSupported()) {
    return {
      granted: false,
      denied: true,
      prompt: false,
      error: 'Camera is not supported in this browser'
    };
  }

  try {
    // Request access to camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Prefer back camera for scanning
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    // Stop the stream immediately as we just needed permission
    stream.getTracks().forEach(track => track.stop());

    return {
      granted: true,
      denied: false,
      prompt: false
    };
  } catch (error) {
    console.error('Camera permission error:', error);
    
    const err = error as DOMException;
    let errorMessage = 'Failed to access camera';
    
    switch (err.name) {
      case 'NotAllowedError':
        errorMessage = 'Camera access was denied. Please allow camera access in your browser settings.';
        break;
      case 'NotFoundError':
        errorMessage = 'No camera was found on this device.';
        break;
      case 'NotSupportedError':
        errorMessage = 'Camera is not supported on this device.';
        break;
      case 'OverconstrainedError':
        errorMessage = 'Camera constraints could not be satisfied.';
        break;
      case 'SecurityError':
        errorMessage = 'Camera access was blocked due to security restrictions.';
        break;
    }

    return {
      granted: false,
      denied: err.name === 'NotAllowedError',
      prompt: err.name === 'NotAllowedError',
      error: errorMessage
    };
  }
}

/**
 * Get the current camera permission status without requesting it
 */
export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  if (!isCameraSupported()) {
    return {
      granted: false,
      denied: true,
      prompt: false,
      error: 'Camera is not supported in this browser'
    };
  }

  try {
    // Check permission status using Permissions API if available
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      return {
        granted: permission.state === 'granted',
        denied: permission.state === 'denied',
        prompt: permission.state === 'prompt'
      };
    }
    
    // Fallback: try to access camera without constraints
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    
    return {
      granted: true,
      denied: false,
      prompt: false
    };
  } catch (error) {
    return {
      granted: false,
      denied: true,
      prompt: false,
      error: 'Unable to determine camera permission status'
    };
  }
}

/**
 * Get available camera devices
 */
export async function getCameraDevices(): Promise<CameraDevice[]> {
  if (!isCameraSupported()) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter(device => device.kind === 'videoinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
        kind: device.kind as 'videoinput'
      }));
  } catch (error) {
    console.error('Error getting camera devices:', error);
    return [];
  }
}

/**
 * Start camera stream with optimal settings for barcode scanning
 */
export async function startCameraStream(deviceId?: string): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: {
      facingMode: deviceId ? undefined : 'environment',
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
      frameRate: { ideal: 30 }
    }
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Stop camera stream and release resources
 */
export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}
