import { useDebouncedValue } from '@tanstack/react-pacer'
import { FileText, Plus, Save, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Cell, GameCell } from 'shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  useCreateCell,
  useLinkCellToGame,
  useSearchCells,
  useUnlinkCell,
} from '@/hooks/api/cells.hooks'
import {
  useApplyTemplate,
  useCreateTemplate,
  useTemplate,
  useTemplates,
  useUpdateTemplate,
} from '@/hooks/api/templates.hooks'
import { cn } from '@/lib/utils'

interface CellManagerProps {
  readonly gameId: string
  readonly gameCells: GameCell[]
  readonly currentTemplateId?: string | null
  readonly gameFriendlyId?: string
  readonly onCellLinked?: (cell: Cell) => void
  readonly onCellUnlinked?: (cellId: string) => void
}

export function CellManager({
  gameId,
  gameCells,
  currentTemplateId,
  gameFriendlyId,
  onCellLinked,
  onCellUnlinked,
}: CellManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownHovered, setDropdownHovered] = useState(false)
  const [showCreateTemplateForm, setShowCreateTemplateForm] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [showTemplateUpdateOptions, setShowTemplateUpdateOptions] =
    useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const templateNameId = useId()
  const templateDescriptionId = useId()

  // Debounce search query using TanStack Pacer
  const [debouncedQuery] = useDebouncedValue(searchQuery, { wait: 300 })

  // API hooks
  const { data: searchResults = [], isLoading: isSearching } =
    useSearchCells(debouncedQuery)
  const { data: templates = [], isLoading: isLoadingTemplates } = useTemplates()
  const createCellMutation = useCreateCell()
  const linkCellMutation = useLinkCellToGame()
  const unlinkCellMutation = useUnlinkCell()
  const createTemplateMutation = useCreateTemplate()
  const updateTemplateMutation = useUpdateTemplate()
  const applyTemplateMutation = useApplyTemplate()

  // Get current template details if currentTemplateId exists
  const { data: currentTemplate, error: templateError } = useTemplate(
    currentTemplateId || '',
    !!currentTemplateId,
  )

  // Check if current template was deleted
  const templateDeleted = currentTemplateId && templateError

  const nameExists = useMemo(() => {
    if (!templateName.trim()) return false
    return templates.some(
      (template) => template.name.toLowerCase() === templateName.toLowerCase(),
    )
  }, [templateName, templates])

  // Extract linked cell IDs for quick lookup
  const linkedCellIds = useMemo(
    () => new Set(gameCells.map((gc) => gc.cellId)),
    [gameCells],
  )

  // Extract all cells with their data
  const allCells = useMemo(
    () =>
      gameCells.map((gc) => ({
        id: gc.cell?.id || gc.id,
        gameCellId: gc.id,
        value: gc.cell?.value || '[Deleted]',
        userId: gc.cell?.userId || '',
        createdAt: gc.cell?.createdAt || gc.createdAt,
        updatedAt: gc.cell?.updatedAt || gc.updatedAt,
      })),
    [gameCells],
  )

  // Total cells count
  const totalCells = allCells.length

  // Template matching logic
  const templateMatches = useMemo(() => {
    if (!currentTemplate || !currentTemplate.templateCells) return false

    // Get current game cell IDs (GameCell doesn't have position, so we use creation order)
    const currentCellIds = gameCells
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((gc) => gc.cellId)

    // Get template cell IDs sorted by position
    const templateCellIds = currentTemplate.templateCells
      .sort((a, b) => a.position - b.position)
      .map((tc) => tc.cellId)

    // Check if arrays have same cells (order might be different since GameCell has no position)
    if (currentCellIds.length !== templateCellIds.length) return false
    const currentSet = new Set(currentCellIds)
    const templateSet = new Set(templateCellIds)
    return (
      currentSet.size === templateSet.size &&
      [...currentSet].every((id) => templateSet.has(id))
    )
  }, [currentTemplate, gameCells])

  // Auto-select template on load and handle template matching
  useEffect(() => {
    if (currentTemplateId) {
      // Always keep the current template selected
      setSelectedTemplateId(currentTemplateId)
      // Show update options if we have 25 cells and they don't match the template
      if (!templateMatches && totalCells === 25) {
        setShowTemplateUpdateOptions(true)
      } else {
        setShowTemplateUpdateOptions(false)
      }
    } else {
      setSelectedTemplateId('')
      setShowTemplateUpdateOptions(false)
    }
  }, [currentTemplateId, templateMatches, totalCells])

  // Add isLinked property to search results
  const searchResultsWithStatus = useMemo(
    () =>
      searchResults.map((cell) => ({
        ...cell,
        isLinked: linkedCellIds.has(cell.id),
      })),
    [searchResults, linkedCellIds],
  )

  // Check if search query doesn't match any results
  const hasExactMatch = searchResultsWithStatus.some(
    (cell) => cell.value.toLowerCase() === debouncedQuery.toLowerCase(),
  )
  const showCreateOption =
    debouncedQuery.length >= 1 && !hasExactMatch && !isSearching

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleInputFocus = useCallback(() => {
    setIsDropdownOpen(true)
  }, [])

  // Only close dropdown if not hovered
  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      if (!dropdownHovered) setIsDropdownOpen(false)
    }, 100)
  }, [dropdownHovered])

  const handleDropdownMouseEnter = useCallback(() => {
    setDropdownHovered(true)
  }, [])
  const handleDropdownMouseLeave = useCallback(() => {
    setDropdownHovered(false)
    // If input is not focused, close dropdown
    if (document.activeElement !== inputRef.current) setIsDropdownOpen(false)
  }, [])

  const handleLinkCell = async (cell: Cell) => {
    // Prevent linking more than 25 cells
    if (totalCells >= 25) return

    try {
      await linkCellMutation.mutateAsync({
        cellId: cell.id,
        gameId,
      })
      onCellLinked?.(cell)
      setSearchQuery('')
    } catch (_error) {}
  }

  const handleUnlinkCell = async (gameCellId: string) => {
    const gameCell = gameCells.find((gc) => gc.id === gameCellId)
    if (!gameCell) return

    try {
      await unlinkCellMutation.mutateAsync({
        gameCellId: gameCell.id,
        gameId,
      })
      onCellUnlinked?.(gameCell.cellId)
    } catch (_error) {}
  }

  const handleCreateAndLink = async () => {
    if (!debouncedQuery.trim()) return
    // Prevent linking more than 25 cells
    if (totalCells >= 25) return

    try {
      const newCell = await createCellMutation.mutateAsync({
        value: debouncedQuery,
      })
      await linkCellMutation.mutateAsync({
        cellId: newCell.id,
        gameId,
      })
      setSearchQuery('')
      onCellLinked?.(newCell)
    } catch (_error) {}
  }

  const handleCreateTemplate = async () => {
    if (!templateName.trim() || totalCells !== 25 || nameExists) return

    try {
      const cellIds = gameCells.map((gc) => gc.cellId)
      const newTemplate = await createTemplateMutation.mutateAsync({
        name: templateName,
        description: templateDescription.trim() || undefined,
        cellIds,
        gameId: gameFriendlyId, // Pass gameFriendlyId to link the template during creation
      })

      // Select the newly created template
      setSelectedTemplateId(newTemplate.id)
      // Reset form
      setShowCreateTemplateForm(false)
      setTemplateName('')
      setTemplateDescription('')

      // Trigger refetch of game data to update currentTemplateId
      onCellLinked?.({} as Cell)
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }

  const handleCancelCreateTemplate = () => {
    setShowCreateTemplateForm(false)
    setTemplateName('')
    setTemplateDescription('')
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) return

    // Don't apply if the selected template is already the current template
    if (selectedTemplateId === currentTemplateId) return

    try {
      await applyTemplateMutation.mutateAsync({
        gameId: gameFriendlyId || gameId,
        templateId: selectedTemplateId,
      })
      setSelectedTemplateId('')
      // Trigger refetch of game cells
      onCellLinked?.({} as Cell)
    } catch (error) {
      console.error('Failed to apply template:', error)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-card min-h-[400px]">
      <div className="space-y-4">
        {/* Templates Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Templates</h3>

          {/* Deleted Template Warning */}
          {templateDeleted && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">
                  Template Deleted
                </span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                The linked template has been deleted. You can create a new
                template or select a different one.
              </p>
            </div>
          )}

          {/* Apply Template */}
          <div className="space-y-2">
            <Label
              htmlFor="template-select"
              className="text-xs text-muted-foreground"
            >
              Apply Template (replaces all cells)
            </Label>
            <div className="flex gap-2">
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={isLoadingTemplates}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a template...">
                    {selectedTemplateId &&
                      templates.find((t) => t.id === selectedTemplateId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium">{template.name}</span>
                        {template.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {template.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {templates.length === 0 && !isLoadingTemplates && (
                    <SelectItem value="no-templates" disabled>
                      No templates found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleApplyTemplate}
                disabled={
                  !selectedTemplateId ||
                  applyTemplateMutation.isPending ||
                  selectedTemplateId === currentTemplateId
                }
                className="shrink-0"
              >
                {applyTemplateMutation.isPending ? (
                  <>
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                    Applying...
                  </>
                ) : (
                  <>
                    <FileText className="h-3 w-3 mr-1" />
                    Apply
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Template Update Options */}
          {showTemplateUpdateOptions && currentTemplate && (
            <div className="space-y-2">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Template "{currentTemplate.name}" doesn't match current
                      cells
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    You can update the template with the current configuration.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (
                        !currentTemplate ||
                        !currentTemplateId ||
                        totalCells !== 25
                      )
                        return
                      try {
                        const cellIds = gameCells.map((gc) => gc.cellId)
                        await updateTemplateMutation.mutateAsync({
                          templateId: currentTemplateId,
                          data: {
                            name: currentTemplate.name,
                            description:
                              currentTemplate.description || undefined,
                            cellIds,
                          },
                        })
                        setShowTemplateUpdateOptions(false)
                        // Keep the current template selected
                        setSelectedTemplateId(currentTemplateId || '')
                      } catch (error) {
                        console.error('Failed to update template:', error)
                      }
                    }}
                    disabled={
                      updateTemplateMutation.isPending || totalCells !== 25
                    }
                    className="w-full text-xs"
                  >
                    {updateTemplateMutation.isPending ? (
                      <>
                        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                        Updating...
                      </>
                    ) : totalCells !== 25 ? (
                      <>
                        <Save className="h-3 w-3 mr-1" />
                        Update Template ({totalCells}/25 cells)
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 mr-1" />
                        Update Template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Create Template */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Save Current Configuration
            </Label>
            {!showCreateTemplateForm ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateTemplateForm(true)}
                disabled={totalCells !== 25}
                className="w-full flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Create Template
                {totalCells !== 25 && (
                  <span className="text-xs text-muted-foreground">
                    ({totalCells}/25 cells)
                  </span>
                )}
              </Button>
            ) : (
              <div className="space-y-3 p-3 border rounded-md bg-muted/50">
                <div className="space-y-2">
                  <Label
                    htmlFor={templateNameId}
                    className="text-xs font-medium"
                  >
                    Template Name *
                  </Label>
                  <Input
                    id={templateNameId}
                    placeholder="e.g., Streaming Essentials"
                    value={templateName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTemplateName(e.target.value)
                    }
                    maxLength={100}
                    className={
                      nameExists ? 'border-red-500 focus:border-red-500' : ''
                    }
                  />
                  {nameExists && (
                    <p className="text-xs text-red-500">
                      Template name already exists
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={templateDescriptionId}
                    className="text-xs font-medium"
                  >
                    Description
                  </Label>
                  <Input
                    id={templateDescriptionId}
                    placeholder="Optional description..."
                    value={templateDescription}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTemplateDescription(e.target.value)
                    }
                    maxLength={500}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelCreateTemplate}
                    disabled={createTemplateMutation.isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateTemplate}
                    disabled={
                      !templateName.trim() ||
                      createTemplateMutation.isPending ||
                      nameExists ||
                      totalCells !== 25
                    }
                    className="flex-1"
                  >
                    {createTemplateMutation.isPending ? (
                      <>
                        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 mr-1" />
                        Create
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm">Manage Cells</h3>

          {/* Search Dropdown */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search or create cells..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="pl-10"
                autoComplete="off"
              />
            </div>
            {/* Dropdown */}
            {(isDropdownOpen || dropdownHovered) && (
              <div
                data-dropdown
                role="menu"
                tabIndex={0}
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto"
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                {(!debouncedQuery || debouncedQuery.trim().length === 0) && (
                  <div className="p-3 text-sm text-muted-foreground">
                    {totalCells >= 25
                      ? 'Maximum cells reached (25/25)'
                      : 'Type to search'}
                  </div>
                )}
                {debouncedQuery && isSearching && (
                  <div className="p-3 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
                {debouncedQuery &&
                  !isSearching &&
                  searchResultsWithStatus.length === 0 &&
                  !showCreateOption && (
                    <div className="p-3 text-sm text-muted-foreground">
                      No cells found
                    </div>
                  )}
                {/* Create Option */}
                {showCreateOption && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Create New
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateAndLink}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={
                        createCellMutation.isPending ||
                        linkCellMutation.isPending ||
                        totalCells >= 25
                      }
                      className="w-full flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none text-left"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {totalCells >= 25
                        ? 'Maximum cells reached (25/25)'
                        : `Create "${debouncedQuery}"`}
                    </button>
                  </div>
                )}
                {/* Search Results */}
                {searchResultsWithStatus.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Existing Cells
                    </div>
                    {searchResultsWithStatus.map((cell) => (
                      <button
                        type="button"
                        key={cell.id}
                        onClick={() =>
                          !cell.isLinked &&
                          totalCells < 25 &&
                          handleLinkCell(cell)
                        }
                        onMouseDown={(e) => e.preventDefault()}
                        disabled={
                          cell.isLinked ||
                          linkCellMutation.isPending ||
                          totalCells >= 25
                        }
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none text-left',
                          (cell.isLinked || totalCells >= 25) &&
                            'cursor-not-allowed',
                        )}
                      >
                        <span className="flex-1">{cell.value}</span>
                        {cell.isLinked && (
                          <span className="text-xs text-muted-foreground ml-2">
                            Already linked
                          </span>
                        )}
                        {!cell.isLinked && totalCells >= 25 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            Max reached (25/25)
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* All Cells */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">
            Cells ({totalCells} / 25)
          </span>
          <div className="space-y-1">
            {allCells.map((cell) => (
              <div
                key={cell.gameCellId}
                className="flex items-center justify-between p-2 text-xs rounded bg-muted/50"
              >
                <span className="truncate flex-1">{cell.value}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUnlinkCell(cell.gameCellId)}
                  disabled={unlinkCellMutation.isPending}
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {allCells.length === 0 && (
              <div className="text-xs text-muted-foreground py-2">
                No cells linked yet. Search and add cells above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
