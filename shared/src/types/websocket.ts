export interface WebSocketPlayerBoard {
  id: string
  playerId: string
  gameId: string
  createdAt: Date | string
  updatedAt: Date | string | null
  connected: boolean
  status: string
  hasBingo: boolean
  playerBoardCells?: Array<{
    id: string
    createdAt: Date | string
    updatedAt: Date | string | null
    playerBoardId: string | null
    gameCellId: string | null
    position: number
    gameCell?: {
      id: string
      createdAt: Date | string
      updatedAt: Date | string | null
      gameId: string
      cellId: string
      marked: boolean
      cell: {
        id: string
        createdAt: Date | string
        updatedAt: Date | string | null
        value: string
        userId: string
      }
    } | null
  }>
}

export interface BingoPlayer {
  playerId: string
  playerBoardId: string
  playerName: string
  bingoCount: number
  isMegaBingo: boolean
}

export interface GameData {
  id: string
  title: string
  creatorId: string
}

export interface StreamAuthenticateMessage {
  type: 'authenticate_stream'
  token: string
}

export interface StreamPingMessage {
  type: 'ping'
}

export interface StreamAuthenticatedMessage {
  type: 'authenticated'
  data: {
    connectionId: string
    userId: string
  }
}

export interface StreamGameUpdateMessage {
  type: 'stream_game_update'
  data: {
    gameId: string
    gameTitle: string
    playerBoard: WebSocketPlayerBoard
  }
}

export interface StreamNoGameMessage {
  type: 'no_stream_game'
}

export interface StreamBingoMessage {
  type: 'bingo_achieved'
  data: {
    bingoPlayers: BingoPlayer[]
    newBingoPlayers: BingoPlayer[]
    isMegaBingo: boolean
  }
}

export interface StreamErrorMessage {
  type: 'error'
  data: {
    message: string
  }
}

export type StreamIncomingMessage =
  | StreamAuthenticateMessage
  | StreamPingMessage

export type StreamOutgoingMessage =
  | StreamAuthenticatedMessage
  | StreamGameUpdateMessage
  | StreamNoGameMessage
  | StreamBingoMessage
  | StreamErrorMessage

export interface GameAuthenticateMessage {
  type: 'authenticate'
  gameId: string
  token: string
}

export interface GameMarkCellMessage {
  type: 'mark_cell'
  cellId: string
}

export interface GameShuffleBoardMessage {
  type: 'shuffle_board'
}

export interface GamePingMessage {
  type: 'ping'
}

export type GameIncomingMessage =
  | GameAuthenticateMessage
  | GameMarkCellMessage
  | GameShuffleBoardMessage
  | GamePingMessage

export type GameOutgoingMessage = StreamOutgoingMessage
