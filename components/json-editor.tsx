"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Check } from "lucide-react"

interface JsonEditorProps {
  value: any
  onChange: (value: any) => void
  height?: string
}

export function JsonEditor({ value, onChange, height = "300px" }: JsonEditorProps) {
  const [jsonString, setJsonString] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(true)

  // Update the editor when the value prop changes
  useEffect(() => {
    try {
      const formatted = JSON.stringify(value, null, 2)
      setJsonString(formatted)
      setError(null)
      setIsValid(true)
    } catch (err) {
      setError("Invalid JSON object provided")
      setIsValid(false)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setJsonString(newValue)

    try {
      const parsed = JSON.parse(newValue)
      onChange(parsed)
      setError(null)
      setIsValid(true)
    } catch (err) {
      setError("Invalid JSON syntax")
      setIsValid(false)
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonString)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonString(formatted)
      setError(null)
      setIsValid(true)
    } catch (err) {
      setError("Cannot format invalid JSON")
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={jsonString}
          onChange={handleChange}
          className={`w-full font-mono text-sm p-3 rounded-md border ${
            error ? "border-red-500" : "border-gray-300"
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          style={{ height, resize: "vertical" }}
          spellCheck="false"
        />
        <div className="absolute top-2 right-2">
          {isValid ? (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Valid
            </span>
          ) : (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Invalid
            </span>
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={formatJson} size="sm" variant="outline">
          Format JSON
        </Button>
      </div>
    </div>
  )
}
