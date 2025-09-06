import type { Cell } from './cell'
import type { User } from './user'

export interface Template {
  id: string
  name: string
  description: string | null
  creatorId: string
  createdAt: Date
  updatedAt: Date | null
}

export interface TemplateWithCreator extends Template {
  creator: User
  isUsedInGames?: boolean
  isUsedInNonDraftGames?: boolean
  canDelete?: boolean
  canEdit?: boolean
}

export interface TemplateCell {
  id: string
  templateId: string
  cellId: string
  position: number
  createdAt: Date
  updatedAt: Date | null
}

export interface TemplateCellWithCell extends TemplateCell {
  cell: Cell
}

export interface TemplateWithCells extends TemplateWithCreator {
  templateCells: TemplateCellWithCell[]
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  cellIds: string[]
  gameId?: string // Optional gameId to link template during creation
}

export interface ApplyTemplateRequest {
  templateId: string
}
