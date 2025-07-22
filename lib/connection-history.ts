export interface ConnectionConfig {
  id: string
  name: string
  host: string
  port: string
  protocol: "http" | "https"
  apiKey: string
  createdAt: string
  lastUsed: string
}

const STORAGE_KEY = "typesense-connection-history"
const MAX_HISTORY_ITEMS = 10

export class ConnectionHistoryManager {
  static getHistory(): ConnectionConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const history = JSON.parse(stored) as ConnectionConfig[]
      // Sort by last used, most recent first
      return history.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    } catch (error) {
      console.error("Failed to load connection history:", error)
      return []
    }
  }

  static saveConnection(config: Omit<ConnectionConfig, "id" | "createdAt" | "lastUsed">): ConnectionConfig {
    try {
      const history = this.getHistory()
      const now = new Date().toISOString()

      // Check if connection already exists (same host, port, protocol)
      const existingIndex = history.findIndex(
        (item) => item.host === config.host && item.port === config.port && item.protocol === config.protocol,
      )

      let savedConfig: ConnectionConfig

      if (existingIndex >= 0) {
        // Update existing connection
        savedConfig = {
          ...history[existingIndex],
          ...config,
          lastUsed: now,
        }
        history[existingIndex] = savedConfig
      } else {
        // Create new connection
        savedConfig = {
          ...config,
          id: this.generateId(),
          createdAt: now,
          lastUsed: now,
        }
        history.unshift(savedConfig)
      }

      // Keep only the most recent items
      const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory))
      return savedConfig
    } catch (error) {
      console.error("Failed to save connection:", error)
      throw error
    }
  }

  static updateLastUsed(id: string): void {
    try {
      const history = this.getHistory()
      const index = history.findIndex((item) => item.id === id)

      if (index >= 0) {
        history[index].lastUsed = new Date().toISOString()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
      }
    } catch (error) {
      console.error("Failed to update last used:", error)
    }
  }

  static deleteConnection(id: string): void {
    try {
      const history = this.getHistory()
      const filtered = history.filter((item) => item.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("Failed to delete connection:", error)
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear history:", error)
    }
  }

  private static generateId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static getDefaultName(host: string, port: string, protocol: string): string {
    const portSuffix = port ? `:${port}` : ""
    return `${protocol}://${host}${portSuffix}`
  }
}
