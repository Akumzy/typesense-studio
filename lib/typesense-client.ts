import type {
  TypesenseConfig,
  TypesenseNode,
  CollectionSchema,
  SearchParameters,
  SearchResponse,
  TypesenseError,
} from "../types/typesense"

export class TypesenseClient {
  private config: TypesenseConfig
  private currentNodeIndex = 0

  constructor(config: TypesenseConfig) {
    this.config = {
      connectionTimeoutSeconds: 5,
      healthcheckIntervalSeconds: 15,
      numRetries: 3,
      retryIntervalSeconds: 1,
      ...config,
    }
  }

  private getCurrentNode(): TypesenseNode {
    return this.config.nodes[this.currentNodeIndex]
  }

  private getNextNode(): TypesenseNode {
    this.currentNodeIndex = (this.currentNodeIndex + 1) % this.config.nodes.length
    return this.getCurrentNode()
  }

  private buildUrl(path: string): string {
    const node = this.getCurrentNode()
    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    return `${node.protocol}://${node.host}:${node.port}${normalizedPath}`
  }

  private async makeRequest<T>(method: string, path: string, body?: any, retries = 0): Promise<T> {
    try {
      const url = this.buildUrl(path)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-TYPESENSE-API-KEY": this.config.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout((this.config.connectionTimeoutSeconds || 5) * 1000),
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const error: TypesenseError = await response.json()
          errorMessage = `Typesense Error (${error.http_code}): ${error.message}`
        } catch {
          // If we can't parse the error as JSON, use the default message
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      if (retries < (this.config.numRetries || 3)) {
        // Try next node
        this.getNextNode()
        await new Promise((resolve) => setTimeout(resolve, (this.config.retryIntervalSeconds || 1) * 1000))
        return this.makeRequest<T>(method, path, body, retries + 1)
      }
      throw error
    }
  }

  // Collection operations
  async createCollection(schema: CollectionSchema): Promise<CollectionSchema> {
    return this.makeRequest<CollectionSchema>("POST", "/collections", schema)
  }

  async getCollection(name: string): Promise<CollectionSchema> {
    return this.makeRequest<CollectionSchema>("GET", `/collections/${name}`)
  }

  async listCollections(): Promise<CollectionSchema[]> {
    return this.makeRequest<CollectionSchema[]>("GET", "/collections")
  }

  async deleteCollection(name: string): Promise<{ name: string }> {
    return this.makeRequest<{ name: string }>("DELETE", `/collections/${name}`)
  }

  // Document operations
  async indexDocument<T>(collectionName: string, document: T): Promise<T> {
    return this.makeRequest<T>("POST", `/collections/${collectionName}/documents`, document)
  }

  async indexDocuments<T>(
    collectionName: string,
    documents: T[],
    options?: { action?: "create" | "update" | "upsert" },
  ): Promise<any[]> {
    const action = options?.action || "upsert"
    const body = documents.map((doc) => JSON.stringify(doc)).join("\n")

    const url = this.buildUrl(`/collections/${collectionName}/documents/import?action=${action}`)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "X-TYPESENSE-API-KEY": this.config.apiKey,
      },
      body,
      signal: AbortSignal.timeout((this.config.connectionTimeoutSeconds || 5) * 1000),
    })

    if (!response.ok) {
      throw new Error(`Failed to index documents: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    return text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))
  }

  async getDocument<T>(collectionName: string, id: string): Promise<T> {
    return this.makeRequest<T>("GET", `/collections/${collectionName}/documents/${id}`)
  }

  async updateDocument<T>(collectionName: string, id: string, document: Partial<T>): Promise<T> {
    return this.makeRequest<T>("PATCH", `/collections/${collectionName}/documents/${id}`, document)
  }

  async deleteDocument(collectionName: string, id: string): Promise<{ id: string }> {
    return this.makeRequest<{ id: string }>("DELETE", `/collections/${collectionName}/documents/${id}`)
  }

  // Search operations
  async search<T>(collectionName: string, searchParams: SearchParameters): Promise<SearchResponse<T>> {
    const queryString = new URLSearchParams()

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value))
      }
    })

    return this.makeRequest<SearchResponse<T>>(
      "GET",
      `/collections/${collectionName}/documents/search?${queryString.toString()}`,
    )
  }

  async multiSearch<T>(
    searches: Array<{
      collection: string
      params: SearchParameters
    }>,
  ): Promise<SearchResponse<T>[]> {
    const body = {
      searches: searches.map((search) => ({
        collection: search.collection,
        ...search.params,
      })),
    }

    const response = await this.makeRequest<{ results: SearchResponse<T>[] }>("POST", "/multi_search", body)

    return response.results
  }

  // Health check
  async health(): Promise<{ ok: boolean }> {
    return this.makeRequest<{ ok: boolean }>("GET", "/health")
  }

  // Stats
  async stats(): Promise<any> {
    return this.makeRequest<any>("GET", "/stats.json")
  }

  // Metrics
  async metrics(): Promise<string> {
    const url = this.buildUrl("/metrics.json")
    const response = await fetch(url, {
      headers: {
        "X-TYPESENSE-API-KEY": this.config.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`)
    }

    return response.text()
  }
}
