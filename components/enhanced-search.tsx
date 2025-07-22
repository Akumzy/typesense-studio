"use client"

import { useState, useEffect } from "react"
import type { TypesenseClient } from "../lib/typesense-client"
import { AdvancedSearch } from "./advanced-search"
import { FacetSidebar } from "./facet-sidebar"
import { SearchResults } from "./search-results"
import { DocumentViewer } from "./document-viewer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { SearchParameters, SearchResponse } from "../types/typesense"

interface EnhancedSearchProps {
  client: TypesenseClient
}

export function EnhancedSearch({ client }: EnhancedSearchProps) {
  const [collections, setCollections] = useState<string[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>("")
  const [collectionFields, setCollectionFields] = useState<string[]>([])
  const [searchParams, setSearchParams] = useState<SearchParameters>({
    q: "", // Default to empty, user must input or select fields
    query_by: "", // Default to empty
    page: 1,
    per_page: 10,
  })
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>({})
  const [viewingDocument, setViewingDocument] = useState<any | null>(null)

  // Load collections on mount
  useEffect(() => {
    loadCollections()
  }, [])

  // Load collection fields when a collection is selected
  useEffect(() => {
    if (selectedCollection) {
      loadCollectionFields(selectedCollection)
      // Clear search parameters and selected facets when collection changes
      setSearchParams({
        q: "",
        query_by: "",
        page: 1,
        per_page: 10,
      })
      setSelectedFacets({})
    }
  }, [selectedCollection])

  // No automatic initial search here. User must trigger it.

  const loadCollections = async () => {
    try {
      setIsLoading(true)
      const collectionsData = await client.listCollections()
      const collectionNames = collectionsData.map((c) => c.name)
      setCollections(collectionNames)

      if (collectionNames.length > 0) {
        setSelectedCollection(collectionNames[0])
      }

      setError(null)
    } catch (err) {
      console.error("Failed to load collections:", err)
      setError("Failed to load collections. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCollectionFields = async (collectionName: string) => {
    try {
      setIsLoading(true)
      const collection = await client.getCollection(collectionName)
      const fields = collection.fields.map((field) => field.name)
      setCollectionFields(fields)
      setError(null)
    } catch (err) {
      console.error(`Failed to load fields for collection ${collectionName}:`, err)
      setError(`Failed to load fields for collection ${collectionName}.`)
    } finally {
      setIsLoading(false)
    }
  }

  const performSearch = async (params: SearchParameters) => {
    if (!selectedCollection) {
      setError("Please select a collection first.")
      return
    }

    // Ensure a search field is selected or query is provided
    if (!params.q && (!params.query_by || params.query_by.split(",").filter(Boolean).length === 0)) {
      setError("Please enter a search query or select at least one search field.")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Apply selected facets to filter_by
      let filterBy = params.filter_by || ""

      Object.entries(selectedFacets).forEach(([field, values]) => {
        if (values.length > 0) {
          /* only add facets that exist in the current facet_counts
           (i.e. they are facet-enabled in the schema)            */
          const allowed = searchResults?.facet_counts?.some((f) => f.field_name === field) ?? true

          if (allowed) {
            const orClause = values.map((v) => `${field}:="${String(v).replace(/"/g, '\\"')}"`).join(" || ")
            filterBy = filterBy ? `${filterBy} && (${orClause})` : `(${orClause})`
          }
        }
      })

      // Use params.facet_by directly, do not force all collection fields
      const searchResponse = await client.search(selectedCollection, {
        ...params,
        filter_by: filterBy,
      })

      setSearchResults(searchResponse)
    } catch (err) {
      console.error("Search failed:", err)
      setError("Search failed. Please check your query and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (params: SearchParameters) => {
    setSearchParams(params)
    performSearch(params)
  }

  const handlePageChange = (page: number) => {
    const newParams = { ...searchParams, page }
    setSearchParams(newParams)
    performSearch(newParams)
  }

  const handlePageSizeChange = (per_page: number) => {
    const newParams = { ...searchParams, per_page, page: 1 }
    setSearchParams(newParams)
    performSearch(newParams)
  }

  const handleFacetSelect = (field: string, value: string, selected: boolean) => {
    const currentValues = selectedFacets[field] || []

    const newValues = selected ? [...currentValues, value] : currentValues.filter((v) => v !== value)

    const newSelectedFacets = {
      ...selectedFacets,
      [field]: newValues,
    }

    setSelectedFacets(newSelectedFacets)

    // Re-run search with updated facets
    performSearch(searchParams)
  }

  const handleViewDocument = (document: any) => {
    setViewingDocument(document)
  }

  return (
    <div className="flex-1 flex flex-col gap-6 w-full">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AdvancedSearch
        collections={collections}
        selectedCollection={selectedCollection}
        onCollectionChange={setSelectedCollection}
        onSearch={handleSearch}
        isLoading={isLoading}
        fields={collectionFields}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="lg:col-span-1">
          <FacetSidebar
            facets={searchResults?.facet_counts || []} // Always pass an array, even if empty
            onFacetSelect={handleFacetSelect}
            selectedFacets={selectedFacets}
          />
        </div>

        <div className="overflow-x-auto lg:col-span-1">
          <SearchResults
            results={searchResults}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onViewDocument={handleViewDocument}
          />
        </div>
      </div>

      <DocumentViewer document={viewingDocument} isOpen={!!viewingDocument} onClose={() => setViewingDocument(null)} />
    </div>
  )
}
