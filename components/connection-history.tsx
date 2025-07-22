"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ConnectionHistoryManager, type ConnectionConfig } from "../lib/connection-history"
import { History, Clock, Trash2, MoreVertical, Plus, Edit, Star } from "lucide-react"

interface ConnectionHistoryProps {
  onSelectConnection: (config: ConnectionConfig) => void
  onNewConnection: () => void
  currentConfig?: {
    host: string
    port: string
    protocol: "http" | "https"
    apiKey: string
  }
}

export function ConnectionHistory({ onSelectConnection, onNewConnection, currentConfig }: ConnectionHistoryProps) {
  const [history, setHistory] = useState<ConnectionConfig[]>(ConnectionHistoryManager.getHistory())
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<ConnectionConfig | null>(null)
  const [editName, setEditName] = useState("")

  const refreshHistory = () => {
    setHistory(ConnectionHistoryManager.getHistory())
  }

  const handleSelectConnection = (config: ConnectionConfig) => {
    ConnectionHistoryManager.updateLastUsed(config.id)
    refreshHistory()
    onSelectConnection(config)
  }

  const handleDeleteConnection = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    ConnectionHistoryManager.deleteConnection(id)
    refreshHistory()
  }

  const handleEditConnection = (config: ConnectionConfig, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingConnection(config)
    setEditName(config.name)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingConnection && editName.trim()) {
      const updatedConfig = { ...editingConnection, name: editName.trim() }
      ConnectionHistoryManager.saveConnection(updatedConfig)
      refreshHistory()
      setIsEditDialogOpen(false)
      setEditingConnection(null)
      setEditName("")
    }
  }

  const handleClearHistory = () => {
    ConnectionHistoryManager.clearHistory()
    refreshHistory()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const isCurrentConnection = (config: ConnectionConfig) => {
    return (
      currentConfig &&
      currentConfig.host === config.host &&
      currentConfig.port === config.port &&
      currentConfig.protocol === config.protocol
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Connection History
          </CardTitle>
          <CardDescription>No saved connections yet</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onNewConnection} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create New Connection
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Connection History
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onNewConnection}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearHistory}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Select from your saved connections</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {history.map((config) => (
                <div
                  key={config.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    isCurrentConnection(config) ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleSelectConnection(config)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{config.name}</h4>
                        {isCurrentConnection(config) && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {config.protocol}://{config.host}
                        {config.port && `:${config.port}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {config.protocol.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(config.lastUsed)}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEditConnection(config, e)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Name
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteConnection(config.id, e)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Connection Name</DialogTitle>
            <DialogDescription>Change the display name for this connection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connectionName">Connection Name</Label>
              <Input
                id="connectionName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter connection name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
