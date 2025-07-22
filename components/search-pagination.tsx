"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalResults: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function SearchPagination({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const startResult = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endResult = Math.min(currentPage * pageSize, totalResults)

  const handlePageSizeChange = (value: string) => {
    onPageSizeChange(Number(value))
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
      <div className="text-sm text-muted-foreground">
        Showing {startResult} to {endResult} of {totalResults} results
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="icon" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          <div className="flex items-center gap-1 mx-2">
            <span className="text-sm font-medium">Page</span>
            <Select value={currentPage.toString()} onValueChange={(value) => onPageChange(Number(value))}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue placeholder={currentPage} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">of {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>

        <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
