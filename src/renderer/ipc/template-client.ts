export interface TemplateClient {
  loadGameTemplate(gameName: string): Promise<any>
}

export class ElectronTemplateClient implements TemplateClient {
  loadGameTemplate(gameName: string): Promise<any> {
    return window.electronAPI.loadGameTemplate(gameName)
  }
}
