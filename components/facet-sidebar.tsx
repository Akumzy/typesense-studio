"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import type { FacetCount } from "../types/typesense"

interface FacetSidebarProps {
  facets: FacetCount[]
  onFacetSelect: (field: string, value: string, selected: boolean) => void
  selectedFacets: Record<string, string[]>
}

export function FacetSidebar({ facets, onFacetSelect, selectedFacets }: FacetSidebarProps) {
  const [expandedFacets, setExpandedFacets] = useState<Record<string, boolean>>(
    Object.fromEntries(facets.map((facet) => [facet.field_name, true])),
  )
  const [facetSearches, setFacetSearches] = useState<Record<string, string>>({})

  const toggleFacet = (facetName: string) => {
    setExpandedFacets((prev) => ({
      ...prev,
      [facetName]: !prev[facetName],
    }))
  }

  const updateFacetSearch = (facetName: string, search: string) => {
    setFacetSearches((prev) => ({
      ...prev,
      [facetName]: search,
    }))
  }

  const isFacetSelected = (field: string, value: string) => {
    return selectedFacets[field]?.includes(value) || false
  }

  const getFilteredCounts = (facet: FacetCount) => {
    const search = facetSearches[facet.field_name] || ""
    if (!search) return facet.counts

    return facet.counts.filter((count) => count.value.toLowerCase().includes(search.toLowerCase()))
  }

  return (
    <div className="w-full space-y-4">
      <h3 className="font-medium text-lg">Refine Results</h3>

      {facets.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground border rounded-md">
          No facets available for this search
        </div>
      ) : (
        facets.map((facet) => {
          const filteredCounts = getFilteredCounts(facet)

          return (
            <div key={facet.field_name} className="border rounded-md">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                onClick={() => toggleFacet(facet.field_name)}
              >
                <h4 className="font-medium capitalize">{facet.field_name.replace(/_/g, " ")}</h4>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {expandedFacets[facet.field_name] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedFacets[facet.field_name] && (
                <div className="p-3 border-t">
                  <div className="mb-2 relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${facet.field_name}...`}
                      value={facetSearches[facet.field_name] || ""}
                      onChange={(e) => updateFacetSearch(facet.field_name, e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <ScrollArea className="h-48 pr-4">
                    <div className="space-y-1">
                      {filteredCounts.length > 0 ? (
                        filteredCounts.map((count) => (
                          <div key={`${facet.field_name}-${count.value}`} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${facet.field_name}-${count.value}`}
                                checked={isFacetSelected(facet.field_name, count.value)}
                                onCheckedChange={(checked) =>
                                  onFacetSelect(facet.field_name, count.value, checked === true)
                                }
                              />
                              <Label htmlFor={`${facet.field_name}-${count.value}`} className="text-sm cursor-pointer">
                                {count.value}
                              </Label>
                            </div>
                            <Badge variant="outline" className="ml-auto">
                              {count.count}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-2 text-muted-foreground text-sm">No matching values</div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
