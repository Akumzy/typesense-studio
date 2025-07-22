"use client"

import { useState, useEffect } from "react"
import { TypesenseClient } from "../lib/typesense-client"
import { EnhancedSearch } from "../components/enhanced-search"
import { ConnectionHistory } from "../components/connection-history"
import { ConnectionForm } from "../components/connection-form"
import { ConnectionHistoryManager, type ConnectionConfig } from "../lib/connection-history"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

type ViewMode = "history" | "form" | "search"

export default function Home() {
  const [client, setClient] = useState<TypesenseClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("history")
  const [currentConfig, setCurrentConfig] = useState<ConnectionConfig | null>(null)
  const [editingConfig, setEditingConfig] = useState<ConnectionConfig | null>(null)

  // Check for existing connections on mount
  useEffect(() => {
    const history = ConnectionHistoryManager.getHistory()
    if (history.length === 0) {
      setViewMode("form")
    }
  }, [])

  const initializeClient = async (config: ConnectionConfig) => {
    try {
      setIsLoading(true)
      setError(null)

      const typesenseClient = new TypesenseClient({
        nodes: [
          {
            host: config.host,
            port: config.port ? Number.parseInt(config.port) : config.protocol === "https" ? 443 : 80,
            protocol: config.protocol,
          },
        ],
        apiKey: config.apiKey,
      })

      // Test connection
      await typesenseClient.health()

      setClient(typesenseClient)
      setCurrentConfig(config)
      setIsConnected(true)
      setViewMode("search")

      // Update last used time
      ConnectionHistoryManager.updateLastUsed(config.id)
    } catch (err) {
      console.error("Connection error:", err)
      setError(err instanceof Error ? err.message : "Failed to connect to Typesense")
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectConnection = (config: ConnectionConfig) => {
    initializeClient(config)
  }

  const handleNewConnection = () => {
    setEditingConfig(null)
    setViewMode("form")
  }

  const handleEditConnection = (config: ConnectionConfig) => {
    setEditingConfig(config)
    setViewMode("form")
  }

  const handleBackToHistory = () => {
    setEditingConfig(null)
    setViewMode("history")
  }

  const handleDisconnect = () => {
    setClient(null)
    setCurrentConfig(null)
    setIsConnected(false)
    setViewMode("history")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b bg-card text-card-foreground shadow-sm">
        <h1 className="text-xl font-bold">Typesense Client</h1>
        {isConnected && currentConfig && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Connected to:</span>
            <span className="font-medium">{currentConfig.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="flex items-center gap-1 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col p-4">
        {viewMode === "history" && (
          <div className="max-w-md mx-auto w-full">
            <ConnectionHistory
              onSelectConnection={handleSelectConnection}
              onNewConnection={handleNewConnection}
              currentConfig={
                currentConfig
                  ? {
                      host: currentConfig.host,
                      port: currentConfig.port,
                      protocol: currentConfig.protocol,
                      apiKey: currentConfig.apiKey,
                    }
                  : undefined
              }
            />
          </div>
        )}

        {viewMode === "form" && (
          <ConnectionForm
            onConnect={initializeClient}
            onBack={handleBackToHistory}
            initialConfig={
              editingConfig
                ? {
                    host: editingConfig.host,
                    port: editingConfig.port,
                    protocol: editingConfig.protocol,
                    apiKey: editingConfig.apiKey,
                  }
                : undefined
            }
            isLoading={isLoading}
            error={error}
          />
        )}

        {viewMode === "search" && client && <EnhancedSearch client={client} />}
      </main>
    </div>
  )
}
