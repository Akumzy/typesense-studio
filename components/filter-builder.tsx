"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus } from "lucide-react"

type FilterOperator = "==" | "!=" | ">=" | "<=" | ">" | "<" | "contains" | "in" | "not in"

interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: string
}

interface FilterGroup {
  id: string
  combinator: "AND" | "OR"
  conditions: FilterCondition[]
}

interface FilterBuilderProps {
  value: string
  onChange: (value: string) => void
  fields: string[]
}

export function FilterBuilder({ value, onChange, fields }: FilterBuilderProps) {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: "group-1",
      combinator: "AND",
      conditions: [{ id: "condition-1", field: fields[0] || "", operator: "==", value: "" }],
    },
  ])

  const addGroup = () => {
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      combinator: "AND",
      conditions: [{ id: `condition-${Date.now()}`, field: fields[0] || "", operator: "==", value: "" }],
    }
    setGroups([...groups, newGroup])
    updateFilterString([...groups, newGroup])
  }

  const removeGroup = (groupId: string) => {
    const newGroups = groups.filter((g) => g.id !== groupId)
    setGroups(newGroups)
    updateFilterString(newGroups)
  }

  const addCondition = (groupId: string) => {
    const newGroups = groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [
            ...group.conditions,
            { id: `condition-${Date.now()}`, field: fields[0] || "", operator: "==", value: "" },
          ],
        }
      }
      return group
    })
    setGroups(newGroups)
    updateFilterString(newGroups)
  }

  const removeCondition = (groupId: string, conditionId: string) => {
    const newGroups = groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.filter((c) => c.id !== conditionId),
        }
      }
      return group
    })
    setGroups(newGroups)
    updateFilterString(newGroups)
  }

  const updateCondition = (groupId: string, conditionId: string, field: string, value: string) => {
    const newGroups = groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map((condition) => {
            if (condition.id === conditionId) {
              return { ...condition, [field]: value }
            }
            return condition
          }),
        }
      }
      return group
    })
    setGroups(newGroups)
    updateFilterString(newGroups)
  }

  const updateCombinator = (groupId: string, combinator: "AND" | "OR") => {
    const newGroups = groups.map((group) => {
      if (group.id === groupId) {
        return { ...group, combinator }
      }
      return group
    })
    setGroups(newGroups)
    updateFilterString(newGroups)
  }

  const updateFilterString = (updatedGroups: FilterGroup[]) => {
    // Build the filter string based on the groups and conditions
    const filterParts = updatedGroups
      .map((group) => {
        if (group.conditions.length === 0) return ""

        const conditionStrings = group.conditions
          .map((condition) => {
            if (!condition.field || !condition.value) return ""

            switch (condition.operator) {
              case "==":
                return `${condition.field}:${condition.value}`
              case "!=":
                return `${condition.field}:!${condition.value}`
              case ">":
                return `${condition.field}:>${condition.value}`
              case ">=":
                return `${condition.field}:>=${condition.value}`
              case "<":
                return `${condition.field}:<${condition.value}`
              case "<=":
                return `${condition.field}:<=${condition.value}`
              case "contains":
                return `${condition.field}:${condition.value}`
              case "in":
                // Assuming comma-separated values for 'in' operator
                return `${condition.field}:[${condition.value}]`
              case "not in":
                // Assuming comma-separated values for 'not in' operator
                return `${condition.field}:![${condition.value}]`
              default:
                return `${condition.field}:${condition.value}`
            }
          })
          .filter(Boolean)

        if (conditionStrings.length === 0) return ""

        const joinedConditions = conditionStrings.join(group.combinator === "AND" ? " && " : " || ")
        return conditionStrings.length > 1 ? `(${joinedConditions})` : joinedConditions
      })
      .filter(Boolean)

    const filterString = filterParts.join(" && ")
    onChange(filterString)
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.id} className="border rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label>Combine with:</Label>
              <Select
                value={group.combinator}
                onValueChange={(value) => updateCombinator(group.id, value as "AND" | "OR")}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="AND" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {groups.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeGroup(group.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {group.conditions.map((condition) => (
              <div key={condition.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(group.id, condition.id, "field", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(group.id, condition.id, "operator", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="==" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="==">==</SelectItem>
                      <SelectItem value="!=">!=</SelectItem>
                      <SelectItem value=">">{">"}</SelectItem>
                      <SelectItem value=">=">{"≥"}</SelectItem>
                      <SelectItem value="<">{"<"}</SelectItem>
                      <SelectItem value="<=">{"≤"}</SelectItem>
                      <SelectItem value="contains">contains</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="not in">not in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-5">
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(group.id, condition.id, "value", e.target.value)}
                    placeholder="Value"
                  />
                </div>

                <div className="col-span-1 flex justify-end">
                  {group.conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(group.id, condition.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => addCondition(group.id)}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add Condition
          </Button>
        </div>
      ))}

      <Button variant="outline" onClick={addGroup} className="flex items-center gap-1 bg-transparent">
        <Plus className="h-4 w-4" /> Add Filter Group
      </Button>
    </div>
  )
}
