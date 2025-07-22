"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchPagination } from "./search-pagination"
import { SortAsc, SortDesc, Eye } from "lucide-react"
import type { SearchResponse, SearchHit } from "../types/typesense"

interface SearchResultsProps {
  results: SearchResponse | null
  isLoading: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onViewDocument: (document: any) => void
}

export function SearchResults({
  results,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onViewDocument,
}: SearchResultsProps) {
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

  if (!results) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No search results yet. Perform a search to see results here.</p>
        </CardContent>
      </Card>
    )
  }

  const getDocumentFields = (hit: SearchHit) => {
    const document = hit.document
    return Object.keys(document).filter((key) => key !== "id" && !key.startsWith("_"))
  }

  const getCommonFields = () => {
    if (results.hits.length === 0) return []

    // Get fields from the first document
    const firstDocFields = getDocumentFields(results.hits[0])

    // Check if all documents have these fields
    return firstDocFields.filter((field) => results.hits.every((hit) => hit.document.hasOwnProperty(field)))
  }

  const commonFields = ["id", ...getCommonFields()]

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"

    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc"
    }

    setSortConfig({ key, direction })
  }

  const sortedHits = [...results.hits].sort((a, b) => {
    if (!sortConfig) return 0

    const { key, direction } = sortConfig
    const valueA = a.document[key]
    const valueB = b.document[key]

    if (valueA === valueB) return 0

    // Handle different types
    if (typeof valueA === "string" && typeof valueB === "string") {
      return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
    }

    return direction === "asc" ? (valueA < valueB ? -1 : 1) : valueA > valueB ? -1 : 1
  })

  const filteredHits = sortedHits.filter((hit) => {
    // Apply column filters
    return Object.entries(columnSearch).every(([field, searchValue]) => {
      if (!searchValue) return true

      const value = hit.document[field]
      if (value === undefined) return false

      return String(value).toLowerCase().includes(searchValue.toLowerCase())
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Search Results</span>
          <Badge variant="outline">
            {results.found} results in {results.search_time_ms}ms
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Actions</TableHead>
                {commonFields.map((field) => (
                  <TableHead key={field} className="min-w-32">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort(field)}>
                        <span>{field}</span>
                        {sortConfig?.key === field &&
                          (sortConfig.direction === "asc" ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </div>
                      <Input
                        placeholder={`Filter ${field}...`}
                        value={columnSearch[field] || ""}
                        onChange={(e) =>
                          setColumnSearch({
                            ...columnSearch,
                            [field]: e.target.value,
                          })
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHits.length > 0 ? (
                filteredHits.map((hit) => (
                  <TableRow key={hit.document.id}>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => onViewDocument(hit.document)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    {commonFields.map((field) => (
                      <TableCell key={field}>
                        {typeof hit.document[field] === "object"
                          ? JSON.stringify(hit.document[field])
                          : String(hit.document[field] || "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={commonFields.length + 1} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4">
          <SearchPagination
            currentPage={results.page}
            totalPages={Math.ceil(results.found / (results.request_params.per_page || 10))}
            totalResults={results.found}
            pageSize={results.request_params.per_page || 10}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}
