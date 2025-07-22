"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { TypesenseClient } from "../lib/typesense-client"
import type { CollectionSchema, SearchResponse } from "../types/typesense"
import { Search, Database, Plus, Trash2, RefreshCw } from "lucide-react"

// Sample data for demonstration
const sampleBooks = [
  {
    id: "1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic Literature",
    year: 1925,
    rating: 4.2,
    description: "A classic American novel set in the Jazz Age",
  },
  {
    id: "2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Classic Literature",
    year: 1960,
    rating: 4.5,
    description: "A gripping tale of racial injustice and childhood innocence",
  },
  {
    id: "3",
    title: "Dune",
    author: "Frank Herbert",
    genre: "Science Fiction",
    year: 1965,
    rating: 4.3,
    description: "Epic science fiction novel set on the desert planet Arrakis",
  },
  {
    id: "4",
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian Fiction",
    year: 1949,
    rating: 4.4,
    description: "A dystopian social science fiction novel",
  },
]

const booksSchema: CollectionSchema = {
  name: "books",
  fields: [
    { name: "id", type: "string" },
    { name: "title", type: "string" },
    { name: "author", type: "string" },
    { name: "genre", type: "string", facet: true },
    { name: "year", type: "int32", facet: true },
    { name: "rating", type: "float" },
    { name: "description", type: "string" },
  ],
  default_sorting_field: "rating",
}

export default function TypesenseDemo() {
  const [client, setClient] = useState<TypesenseClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [collections, setCollections] = useState<CollectionSchema[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Configuration state
  const [config, setConfig] = useState({
    host: "localhost",
    port: "",
    protocol: "http" as "http" | "https",
    apiKey: "xyz",
  })

  const initializeClient = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate configuration
      if (!config.host.trim()) {
        throw new Error("Host is required")
      }

      // Only validate port if it's provided
      if (config.port.trim() && isNaN(Number(config.port))) {
        throw new Error("Port must be a valid number")
      }

      if (!config.apiKey.trim()) {
        throw new Error("API key is required")
      }

      const typesenseClient = new TypesenseClient({
        nodes: [
          {
            host: config.host.trim(),
            port: config.port.trim() ? Number.parseInt(config.port.trim()) : config.protocol === "https" ? 443 : 80,
            protocol: config.protocol,
          },
        ],
        apiKey: config.apiKey.trim(),
      })

      // Test connection
      await typesenseClient.health()

      setClient(typesenseClient)
      setIsConnected(true)
      await loadCollections(typesenseClient)
    } catch (err) {
      console.error("Connection error:", err)
      setError(err instanceof Error ? err.message : "Failed to connect to Typesense")
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCollections = async (typesenseClient?: TypesenseClient) => {
    const activeClient = typesenseClient || client
    if (!activeClient) return

    try {
      const cols = await activeClient.listCollections()
      setCollections(cols)
    } catch (err) {
      console.error("Failed to load collections:", err)
    }
  }

  const createBooksCollection = async () => {
    if (!client) return

    try {
      setIsLoading(true)
      await client.createCollection(booksSchema)
      await client.indexDocuments("books", sampleBooks)
      await loadCollections()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCollection = async (name: string) => {
    if (!client) return

    try {
      setIsLoading(true)
      await client.deleteCollection(name)
      await loadCollections()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete collection")
    } finally {
      setIsLoading(false)
    }
  }

  const performSearch = async () => {
    if (!client || !searchQuery.trim()) return

    try {
      setIsLoading(true)
      const results = await client.search("books", {
        q: searchQuery,
        query_by: "title,author,description",
        facet_by: "genre,year",
        sort_by: "rating:desc",
        per_page: 10,
      })
      setSearchResults(results)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Typesense Client Demo</h1>
        <p className="text-muted-foreground">A comprehensive client for interacting with Typesense search engine</p>
      </div>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Typesense Configuration
              </CardTitle>
              <CardDescription>Configure your Typesense server connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    value={config.host}
                    onChange={(e) => setConfig((prev) => ({ ...prev, host: e.target.value }))}
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    value={config.port}
                    onChange={(e) => setConfig((prev) => ({ ...prev, port: e.target.value }))}
                    placeholder="8108 (optional - defaults to 80/443)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol</Label>
                  <select
                    id="protocol"
                    value={config.protocol}
                    onChange={(e) => setConfig((prev) => ({ ...prev, protocol: e.target.value as "http" | "https" }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Your API key"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={initializeClient} disabled={isLoading} className="flex items-center gap-2">
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  {isConnected ? "Reconnect" : "Connect"}
                </Button>
                {isConnected && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Connected
                  </Badge>
                )}
              </div>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="font-medium text-red-800 mb-2">Connection Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                  <p className="text-red-600 text-xs mt-2">
                    Make sure your Typesense server is running and accessible at {config.protocol}://{config.host}:
                    {config.port}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Collections
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={createBooksCollection}
                    disabled={!isConnected || isLoading}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Books Collection
                  </Button>
                  <Button
                    onClick={() => loadCollections()}
                    disabled={!isConnected || isLoading}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {collections.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No collections found. Create the books collection to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <div key={collection.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{collection.name}</h3>
                        <p className="text-sm text-muted-foreground">{collection.fields.length} fields</p>
                      </div>
                      <Button
                        onClick={() => deleteCollection(collection.name)}
                        disabled={isLoading}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Books
              </CardTitle>
              <CardDescription>Search through the books collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for books, authors, or descriptions..."
                  onKeyDown={(e) => e.key === "Enter" && performSearch()}
                />
                <Button onClick={performSearch} disabled={!isConnected || !searchQuery.trim() || isLoading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {searchResults ? (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found {searchResults.found} results in {searchResults.search_time_ms}ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.hits.map((hit) => (
                    <div key={hit.document.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{hit.document.title}</h3>
                          <p className="text-muted-foreground">
                            by {hit.document.author} • {hit.document.year}
                          </p>
                          <p className="text-sm">{hit.document.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{hit.document.genre}</Badge>
                            <Badge variant="outline">★ {hit.document.rating}</Badge>
                          </div>
                        </div>
                        <Badge variant="outline">Score: {hit.text_match.toFixed(2)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {searchResults.facet_counts && searchResults.facet_counts.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">Facets</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {searchResults.facet_counts.map((facet) => (
                        <div key={facet.field_name}>
                          <h5 className="font-medium text-sm mb-2 capitalize">{facet.field_name}</h5>
                          <div className="space-y-1">
                            {facet.counts.map((count) => (
                              <div key={count.value} className="flex justify-between text-sm">
                                <span>{count.value}</span>
                                <Badge variant="outline" className="text-xs">
                                  {count.count}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No search results yet. Perform a search to see results here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
