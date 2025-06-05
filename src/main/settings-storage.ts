import { app } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { AppSettings } from '../shared/types'

export interface SettingsStorage {
  load(): Promise<Partial<AppSettings>>
  save(settings: AppSettings): Promise<void>
}

export class FileSettingsStorage implements SettingsStorage {
  private filePath: string

  constructor(filePath: string = path.join(app.getPath('userData'), 'settings.json')) {
    this.filePath = filePath
  }

  async load(): Promise<Partial<AppSettings>> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(data) as Partial<AppSettings>
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {}
      }
      throw error
    }
  }

  async save(settings: AppSettings): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(settings, null, 2))
  }
}

export const defaultSettingsStorage = new FileSettingsStorage()

export default FileSettingsStorage
