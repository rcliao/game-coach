export interface ScreenSourceClient {
  getCaptureSources(): Promise<any[]>
  captureFrame?(): Promise<any>
}

export class ElectronScreenSourceClient implements ScreenSourceClient {
  getCaptureSources(): Promise<any[]> {
    return window.electronAPI.getCaptureSource()
  }

  captureFrame(): Promise<any> {
    return window.electronAPI.captureFrame()
  }
}
