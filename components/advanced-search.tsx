"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterBuilder } from "./filter-builder"
import { JsonEditor } from "./json-editor"
import { Search, RefreshCw, Code, Filter } from "lucide-react"
import type { SearchParameters } from "../types/typesense"

interface AdvancedSearchProps {
  collections: string[]
  selectedCollection: string
  onCollectionChange: (collection: string) => void
  onSearch: (params: SearchParameters) => void
  isLoading: boolean
  fields: string[]
}

export function AdvancedSearch({
  collections,
  selectedCollection,
  onCollectionChange,
  onSearch,
  isLoading,
  fields,
}: AdvancedSearchProps) {
  const [activeTab, setActiveTab] = useState<string>("basic")
  const [searchParams, setSearchParams] = useState<SearchParameters>({
    q: "", // Default to empty
    query_by: "", // Default to empty
    filter_by: "",
    sort_by: "",
    facet_by: "", // Default to empty
    page: 1,
    per_page: 10,
  })

  const handleParamChange = (key: keyof SearchParameters, value: any) => {
    setSearchParams((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSearch = () => {
    onSearch(searchParams)
  }

  const handleJsonChange = (json: any) => {
    setSearchParams(json)
  }

  // Determine if the search button should be disabled
  const isSearchDisabled = isLoading || (!searchParams.q && !searchParams.query_by)

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <Label htmlFor="collection" className="min-w-24">
              Collection:
            </Label>
            <Select value={selectedCollection} onValueChange={onCollectionChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection} value={collection}>
                    {collection}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSearch} disabled={isSearchDisabled} className="flex items-center gap-2">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="q">Search Query:</Label>
              <Input
                id="q"
                value={searchParams.q}
                onChange={(e) => handleParamChange("q", e.target.value)}
                placeholder="Enter search terms... (e.g., 'book', or '*' for all results)"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="query_by">Search Fields:</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {fields.map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={`field-${field}`}
                      checked={searchParams.query_by?.split(",").includes(field)}
                      onCheckedChange={(checked) => {
                        const currentFields = searchParams.query_by?.split(",").filter(Boolean) || []
                        const newFields = checked ? [...currentFields, field] : currentFields.filter((f) => f !== field)
                        handleParamChange("query_by", newFields.join(","))
                      }}
                    />
                    <Label htmlFor={`field-${field}`} className="text-sm">
                      {field}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_by">Sort By:</Label>
              <Input
                id="sort_by"
                value={searchParams.sort_by}
                onChange={(e) => handleParamChange("sort_by", e.target.value)}
                placeholder="field:asc,another_field:desc"
              />
              <p className="text-xs text-muted-foreground">Format: field:asc,another_field:desc</p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="filter_by">Filter By:</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleParamChange("filter_by", "")}
                  className="h-8 text-xs"
                >
                  Clear
                </Button>
              </div>
              <FilterBuilder
                value={searchParams.filter_by || ""}
                onChange={(value) => handleParamChange("filter_by", value)}
                fields={fields}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facet_by">Facet By:</Label>
              <Input
                id="facet_by"
                value={searchParams.facet_by}
                onChange={(e) => handleParamChange("facet_by", e.target.value)}
                placeholder="field1,field2,field3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page">Page:</Label>
                <Input
                  id="page"
                  type="number"
                  min={1}
                  value={searchParams.page}
                  onChange={(e) => handleParamChange("page", Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="per_page">Results Per Page:</Label>
                <Select
                  value={searchParams.per_page?.toString()}
                  onValueChange={(value) => handleParamChange("per_page", Number(value))}
                >
                  <SelectTrigger id="per_page">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="json">
            <div className="space-y-2">
              <Label>JSON Query:</Label>
              <JsonEditor value={searchParams} onChange={handleJsonChange} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
