import {
  BaseGame,
  EMPTY_POSITION,
  GAMES_SIDE,
  GAME_STATE,
  GAME_TYPES,
  PLAYER_STEP,
  ALPHABET
} from './BaseGame.js'

import type {
  BasePosition,
  BaseGameData,
  GameSide,
  EmptyPosition,
  ObjectValues,
  GameType
} from './BaseGame.js'

export const emptyBoard: DvonnPieceSetup[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
]

export const testBoard: DvonnPieceSetup[][] = [
  [0, 1, 2, 3, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 1, 2, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
]

export const defaultBoard: DvonnPieceSetup[][] = [
  [2, 1, 2, 1, 2, 2, 1, 2, 1],
  [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
  [3, 1, 2, 1, 2, 3, 1, 2, 1, 2, 3],
  [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
  [2, 1, 2, 1, 1, 2, 1, 2, 1]
]

export const DVONN_BOARD_SETUP = {
  MANUAL: 'manual',
  STANDARD: 'standard',
  RANDOM: 'random'
} as const

export type DvonnBoardSetup = ObjectValues<typeof DVONN_BOARD_SETUP>

const MIN_Z_POSITION = -2
const MAX_Z_POSITION = 2

const START_COUNT_PIECES = 49
const COUNT_DVONN_PIECES = 3

export const DVONN_PIECE_SETUP = {
  EMPTY: 0,
  WHITE: 1,
  BLACK: 2,
  DVONN: 3
} as const

export type DvonnPieceSetup = ObjectValues<typeof DVONN_PIECE_SETUP>

export const DVONN = 'dvonn'

export type DvonnLocation = typeof DVONN

export type DvonnBoardLocation = GameSide | EmptyPosition | DvonnLocation

export type DvonnPosition = BasePosition & {
  value: DvonnBoardLocation
  stackCount: number
  hasDvonnPiece: boolean
}

export type DvonnGameData = BaseGameData<DvonnPosition> & {
  score: [number, number]
  setupPiecesCount: number
}

export type DvonnGameType = typeof DvonnGame

export class DvonnGame extends BaseGame<DvonnPosition, DvonnPieceSetup, DvonnGameData> {
  board: { [key: string]: DvonnPosition }
  score: [number, number]
  setupPiecesCount: number
  static gameType: GameType = GAME_TYPES.DVONN

  constructor(
    boardSetup: DvonnBoardSetup = DVONN_BOARD_SETUP.STANDARD,
    gameName?: string,
    gameId?: string,
    playerIds?: [string, string],
    playerNames?: [string, string]
  ) {
    super(gameName, gameId, playerIds, playerNames)

    this.board = {}
    this.setupPiecesCount = 0
    this.score = [0, 0]
    this.Z_TO_X_LIMITS = {
      '-2': [-3, 5],
      '-1': [-4, 5],
      '0': [-5, 5],
      '1': [-5, 4],
      '2': [-5, 3]
    }

    this.Z_LIMITS = this.calculateZLimits()

    switch (boardSetup) {
      case DVONN_BOARD_SETUP.MANUAL:
        this.createBoard(emptyBoard)
        this.gameState = GAME_STATE.SETUP
        break
      case DVONN_BOARD_SETUP.RANDOM:
        this.createBoard(this.populateBoard(emptyBoard, DvonnGame.createRandomLocatedPieces()))

        this.gameState = GAME_STATE.IN_PROGRESS
        break
      default:
        this.createBoard(defaultBoard)
        this.gameState = GAME_STATE.IN_PROGRESS
    }
    this.addMessageLog(`Using ${DVONN_BOARD_SETUP.MANUAL} setup`)
  }

  public createPosition(piece: DvonnPieceSetup, x: number, y: number, z: number): DvonnPosition {
    let value: DvonnBoardLocation = EMPTY_POSITION

    switch (piece) {
      case DVONN_PIECE_SETUP.WHITE:
        value = GAMES_SIDE.WHITE
        break
      case DVONN_PIECE_SETUP.BLACK:
        value = GAMES_SIDE.BLACK
        break
      case DVONN_PIECE_SETUP.DVONN:
        value = DVONN
    }

    const newPosition: DvonnPosition = {
      value: value,
      stackCount: 0,
      hasDvonnPiece: piece === DVONN_PIECE_SETUP.DVONN,
      allowed: false,
      x,
      y,
      z
    }

    if (
      piece === DVONN_PIECE_SETUP.BLACK ||
      piece === DVONN_PIECE_SETUP.WHITE ||
      piece === DVONN_PIECE_SETUP.DVONN
    ) {
      newPosition.stackCount = 1
    }

    return newPosition
  }

  /**
   *
   * Convert position, y: number, z: number to Dvonn notation [letter, number]
   *
   */
  convertIndexToBoardNotation(x: number, z: number) {
    return `${ALPHABET[z + 5 + x]} ${3 + z}`
  }

  checkGamePosition(x: number, y: number, z: number) {
    return { addPosition: this.isPosWithinBoard(x, z), position: this.posToString(x, y, z) }
  }

  filterPositions(positions: string[], isDvonn: boolean) {
    return positions.filter(
      (position) =>
        this.board[position].value !== EMPTY_POSITION &&
        !(isDvonn && this.board[position].hasDvonnPiece)
    )
  }

  canPlayerMovePiece(x: number, y: number, z: number, size: number = 1): boolean {
    let adjacentEmpty = false
    let potentialCapture = false
    const y_limits = this.Z_TO_X_LIMITS[z]

    // Check if pieace is either on top or bottom row, or has any empty positions surrounding
    if (z === MIN_Z_POSITION || z === MAX_Z_POSITION || y === y_limits[1] || y === y_limits[0]) {
      adjacentEmpty = true
    } else if (
      this.findPositions(x, y, z).find((position) => this.board[position].value === EMPTY_POSITION)
    ) {
      adjacentEmpty = true
    }

    if (
      this.findPositions(x, y, z, size).find(
        (position) =>
          this.board[position].value !== EMPTY_POSITION &&
          !(
            this.board[this.posToString(x, y, z)].hasDvonnPiece &&
            this.board[position].hasDvonnPiece
          )
      )
    ) {
      potentialCapture = true
    }

    return potentialCapture && adjacentEmpty
  }

  checkPlayerAnyMove(side: GameSide): boolean {
    return (
      Object.values(this.board)
        .filter((position) => position.value === side)
        .filter((position) =>
          this.canPlayerMovePiece(position.x, position.y, position.z, position.stackCount)
        ).length > 0
    )
  }

  canPlayerUsePosition(x: number, y: number, z: number): boolean {
    return this.currentPlayer.side == this.board[this.posToString(x, y, z)].value
  }

  proceedToNextPlayer() {
    const nextPlayer =
      this.currentPlayer.id === this.players[0].id ? this.players[1] : this.players[0]

    if (this.checkPlayerAnyMove(nextPlayer.side)) {
      this.currentPlayer = nextPlayer

      // If the current player also can not move - end the game
    } else if (!this.checkPlayerAnyMove(this.currentPlayer.side)) {
      this.endTheGame()
    }
  }

  dfs(
    graph: { [key: string]: DvonnPosition },
    visited: Set<string>,
    x: number,
    y: number,
    z: number
  ) {
    visited.add(this.posToString(x, y, z))

    const neighbors = this.findPositions(x, y, z)

    for (const neighbor of neighbors) {
      if (graph[neighbor] && graph[neighbor].value != EMPTY_POSITION && !visited.has(neighbor)) {
        this.dfs(graph, visited, graph[neighbor].x, graph[neighbor].y, graph[neighbor].z)
      }
    }
  }

  clearNoneDvonnConnected() {
    const allPositions = Object.values(this.board)
    const visited = new Set<string>()
    const dvonnPositions = allPositions.filter((position) => position.hasDvonnPiece)

    for (const dvonnPosition of dvonnPositions) {
      this.dfs(this.board, visited, dvonnPosition.x, dvonnPosition.y, dvonnPosition.z)
    }

    const disconnectedPositions = allPositions.filter(
      (position) =>
        position.value !== EMPTY_POSITION &&
        !visited.has(`${position.x},${position.y},${position.z}`)
    )

    const clearCount = [0, 0]

    for (const position of disconnectedPositions) {
      const currentPos = this.board[`${position.x},${position.y},${position.z}`]

      const index = currentPos.value === GAMES_SIDE.WHITE ? 0 : 1

      currentPos.value = EMPTY_POSITION
      clearCount[index] += currentPos.stackCount
      currentPos.stackCount = 0
    }

    return clearCount
  }

  /**
   *
   * Toggle end game state and calculate score
   *
   */
  endTheGame() {
    this.gameState = GAME_STATE.COMPLETED

    const allPositions = Object.values(this.board)
    this.score = allPositions.reduce(
      (accRow, currentPosition) => {
        if (
          currentPosition.value === GAMES_SIDE.WHITE ||
          currentPosition.value === GAMES_SIDE.BLACK
        ) {
          accRow[currentPosition.value === GAMES_SIDE.WHITE ? 0 : 1] += currentPosition.stackCount
        }

        return accRow
      },
      [0, 0]
    )

    let endText = ''

    if (this.score[0] === this.score[1]) {
      this.winner = 'even'
      endText = 'It is even'
    } else {
      this.winner = this.score[0] > this.score[1] ? this.players[0] : this.players[1]
      endText = `Winner is ${this.winner.name} (${this.winner.side})`
    }
    this.addMessageLog(
      `Game completed WHITE score ${this.score[0]} BLACK score ${this.score[1]}. ${endText}`
    )
  }

  movePeaceToStep(fromX: number, fromY: number, fromZ: number, x: number, y: number, z: number) {
    if (this.currentLegalMoves.find((pos) => pos === this.posToString(x, y, z))) {
      const fromPosition = this.board[`${fromX},${fromY},${fromZ}`]
      const toPosition = this.board[this.posToString(x, y, z)]

      toPosition.stackCount += fromPosition.stackCount
      toPosition.value = fromPosition.value
      fromPosition.value = EMPTY_POSITION
      fromPosition.stackCount = 0

      if (fromPosition.hasDvonnPiece) {
        toPosition.hasDvonnPiece = true
      }

      fromPosition.hasDvonnPiece = false

      this.resetMove()

      const clearCount = this.clearNoneDvonnConnected()

      let clearedText = ''

      if (clearCount[0] || clearCount[1]) {
        clearedText = 'Cleared: '

        if (clearCount[0]) clearedText += `${clearCount[0]} white `

        if (clearCount[1]) clearedText += `${clearCount[0]} black`
      }

      this.addMessageLog(
        `${this.currentPlayer.side} ' from ${this.convertIndexToBoardNotation(
          fromY,
          fromZ
        )} to ${this.convertIndexToBoardNotation(y, z)} stack count: ${
          toPosition.stackCount
        }, ${clearedText}`
      )

      this.proceedToNextPlayer()
    }
  }

  movePeaceFromStep(x: number, y: number, z: number) {
    if (
      this.canPlayerUsePosition(x, y, z) &&
      this.canPlayerMovePiece(x, y, z, this.board[this.posToString(x, y, z)].stackCount)
    ) {
      const positions = this.findPositions(
        x,
        y,
        z,
        this.board[this.posToString(x, y, z)].stackCount
      )

      this.currentLegalMoves = this.filterPositions(
        positions,
        this.board[this.posToString(x, y, z)].hasDvonnPiece
      )

      // // Prepare for movePeace to step

      this.prepareLocationTo(x, y, z)
    }
  }

  clickInSetup(x: number, y: number, z: number) {
    const position = this.board[this.posToString(x, y, z)]
    if (this.board[this.posToString(x, y, z)].value !== EMPTY_POSITION) return

    position.stackCount = 1

    const locDvonnNotation = this.convertIndexToBoardNotation(y, z)

    if (this.setupPiecesCount < COUNT_DVONN_PIECES) {
      position.value = DVONN
      position.hasDvonnPiece = true
      this.addMessageLog(`Placed DVONN piece on: ${locDvonnNotation}`)
    } else {
      const currentPiece = this.setupPiecesCount % 2 == 0 ? GAMES_SIDE.BLACK : GAMES_SIDE.WHITE

      position.value = currentPiece
      this.addMessageLog(`Placed ${currentPiece} piece on: ${locDvonnNotation}`)
    }

    this.setupPiecesCount++

    this.currentPlayer = this.getOtherPlayer()
    this.currentPlayer.id === this.players[0].id ? this.players[1] : this.players[0]

    if (this.setupPiecesCount == START_COUNT_PIECES) {
      this.gameState = GAME_STATE.IN_PROGRESS
      this.currentPlayer = this.getOtherPlayer()
    }
  }

  public clicked(x: number, y: number, z: number) {
    if (this.gameState == GAME_STATE.IN_PROGRESS) {
      if (this.currentPlayerStep === PLAYER_STEP.LOCATION_FROM) {
        this.movePeaceFromStep(x, y, z)
      } else if (x === this.fromX && y === this.fromY && z === this.fromZ) {
        this.resetMove()
      } else if (
        this.currentPlayerStep === PLAYER_STEP.LOCATION_TO &&
        this.fromX !== null &&
        this.fromY !== null &&
        this.fromZ !== null
      ) {
        this.movePeaceToStep(this.fromX, this.fromY, this.fromZ, x, y, z)
      }
    } else if (this.gameState == GAME_STATE.SETUP) {
      this.clickInSetup(x, y, z)
    }
  }

  /**
   *
   * Export the games state
   *
   */
  getGameState(): DvonnGameData {
    const gameState = {
      ...super.getGameState(),
      score: this.score,
      setupPiecesCount: this.setupPiecesCount
    }

    return JSON.parse(JSON.stringify(gameState))
  }

  /**
   *
   * Import the games state
   *
   */
  setGameState(gameData: DvonnGameData): void {
    super.setGameState(gameData)
    this.score = gameData.score
    this.setupPiecesCount = gameData.setupPiecesCount
  }

  static createRandomLocatedPieces(): DvonnPieceSetup[] {
    return [
      ...Array(23).fill(DVONN_PIECE_SETUP.WHITE),
      ...Array(23).fill(DVONN_PIECE_SETUP.BLACK),
      ...Array(3).fill(DVONN_PIECE_SETUP.DVONN)
    ].sort(() => 0.5 - Math.random())
  }

  getGameType(): GameType {
    return DvonnGame.gameType
  }

  shouldUpdate(): boolean {
    return this.currentPlayerStep === PLAYER_STEP.LOCATION_TO || this.gameState == GAME_STATE.SETUP
  }

  static createGameState() {}
}
