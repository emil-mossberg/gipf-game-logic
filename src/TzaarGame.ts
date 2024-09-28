import {
  BaseGame,
  EMPTY_POSITION,
  GAMES_SIDE,
  GAME_STATE,
  PLAYER_STEP,
  ALPHABET,
  GAME_TYPES
} from './BaseGame.js'

import type {
  BasePosition,
  BaseGameData,
  GameSide,
  EmptyPosition,
  ObjectValues,
  GameType
} from './BaseGame.js'

/**
 *
 * GENERAL GAME INFO
 *
 *
 * Using in GAME_STATE.SETUP to implement first step where white player can only do 1 capture instead of 2
 * Movement rules first move is a capture, second is capture OR improve stack size
 *
 * Pieces names
 * Tzaars (2 circles) (6 pieces)
 * Tzarras (1 circles) (9 pieces)
 * Totts (full color) (15 pieces)
 *
 */

export const TZAAR_PIECE_SETUP = {
  EMPTY: 0,
  WHITE_TZAAR: 1,
  WHITE_TZARRAS: 2,
  WHITE_TOTTS: 3,
  BLACK_TZAAR: 4,
  BLACK_TZARRAS: 5,
  BLACK_TOTTS: 6
} as const

export type TzaarPieceSetup = ObjectValues<typeof TZAAR_PIECE_SETUP>

export const TZAAR_PIECE = {
  EMPTY: 'empty',
  WHITE_TZAAR: 'white_tzaar',
  WHITE_TZARRAS: 'white_tzarras',
  WHITE_TOTTS: 'white_totts',
  BLACK_TZAAR: 'black_tzaar',
  BLACK_TZARRAS: 'black_tzarras',
  BLACK_TOTTS: 'black_totts'
} as const

export type TzaarPiece = ObjectValues<typeof TZAAR_PIECE>

const emptyBoard: TzaarPieceSetup[][] = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0]
]

const standardBoard: TzaarPieceSetup[][] = [
  [3, 3, 3, 3, 6],
  [6, 2, 2, 2, 5, 6],
  [6, 5, 1, 1, 4, 5, 6],
  [6, 5, 4, 3, 6, 4, 5, 6],
  [6, 5, 4, 6, 0, 3, 1, 2, 3],
  [3, 2, 1, 3, 6, 1, 2, 3],
  [3, 2, 1, 4, 4, 2, 3],
  [3, 2, 5, 5, 5, 3],
  [3, 6, 6, 6, 6]
]

const testBoard: TzaarPieceSetup[][] = [
  [0, 0, 0, 0, 0],
  [0, 0, 4, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3],
  [0, 0, 0, 0, 0, 0, 0, 3],
  [0, 0, 0, 0, 0, 0, 0, 0, 3],
  [0, 0, 0, 0, 0, 0, 0, 3],
  [0, 0, 0, 0, 0, 0, 3],
  [0, 0, 0, 0, 0, 3],
  [4, 2, 3, 3, 0]
]

export type TzaarBoardLocation = GameSide | EmptyPosition

export type CapturePieces = [number, number, number, number, number, number]

export const PIECES_TYPES = 3

export const ACTION = {
  FIRST: 'first',
  SECOND: 'second'
} as const

export type Action = ObjectValues<typeof ACTION>

export type TzaarPosition = BasePosition & {
  value: TzaarBoardLocation
  piece: TzaarPiece
  pieceNumerical: TzaarPieceSetup
  stackCount: number
}

export const TZAAR_BOARD_SETUP = {
  RANDOM: 'random',
  STANDARD: 'standard'
} as const

export type TzaarBoardSetup = ObjectValues<typeof TZAAR_BOARD_SETUP>

export type TzaarGameData = BaseGameData<TzaarPosition> & {
  currentAction: Action
  remainingPieces: [number, number, number, number, number, number]
  firstMove: boolean
}

export class TzaarGame extends BaseGame<TzaarPosition, TzaarPieceSetup, TzaarGameData> {
  currentAction: Action
  remainingPieces: [number, number, number, number, number, number]
  firstMove: boolean
  static gameType: GameType = GAME_TYPES.TZAAR
  constructor(
    boardSetup: TzaarBoardSetup = TZAAR_BOARD_SETUP.STANDARD,
    gameName?: string,
    gameId?: string,
    playerIds?: [string, string],
    playerNames?: [string, string]
  ) {
    super(gameName, gameId, playerIds, playerNames)
    this.currentAction = ACTION.FIRST
    this.remainingPieces = [6, 9, 15, 6, 9, 15]
    this.firstMove = true

    switch (boardSetup) {
      case TZAAR_BOARD_SETUP.RANDOM:
        this.createBoard(this.populateBoard(emptyBoard, TzaarGame.createRandomLocatedPieces()))
        break
      default:
        this.createBoard(standardBoard)
    }

    this.Z_TO_X_LIMITS = {
      '-4': [0, 4],
      '-3': [-1, 4],
      '-2': [-2, 4],
      '-1': [-3, 4],
      '0': [-4, 4],
      '1': [-4, 3],
      '2': [-4, 2],
      '3': [-4, 1],
      '4': [-4, 0]
    }

    this.Z_LIMITS = this.calculateZLimits()
  }

  public checkOtherPlayerAnyFirstMove() {
    const player = this.getOtherPlayer()

    let canMove = false

    const values = Object.values(this.board)

    for (let i = 0; i < values.length; i++) {
      if (
        values[i].value == player.side &&
        this.findPositions(values[i].x, values[i].y, values[i].z).filter(
          (pos) => this.board[pos].value === this.currentPlayer.side
        ).length
      ) {
        canMove = true
        break
      }
    }

    return canMove
  }

  public endTheGame(winType: string) {
    this.gameState = GAME_STATE.COMPLETED
    this.winner = this.currentPlayer
    this.addMessageLog(`Game side ${this.winner.side} wins because other side ${winType}`)
  }

  public checkEndGame() {
    if (this.remainingPieces.findIndex((count) => count === 0) > -1) {
      this.endTheGame('ran out of a pieces')
    } else if (this.currentAction === ACTION.SECOND && !this.checkOtherPlayerAnyFirstMove()) {
      this.endTheGame('cant do a move')
    }
  }

  public createPosition(
    setupPiece: TzaarPieceSetup,
    x: number,
    y: number,
    z: number
  ): TzaarPosition {
    let value: TzaarBoardLocation = EMPTY_POSITION

    if (setupPiece > 0 && setupPiece <= 3) {
      value = GAMES_SIDE.WHITE
    } else if (setupPiece > 3) {
      value = GAMES_SIDE.BLACK
    }

    let piece: TzaarPiece = TZAAR_PIECE.EMPTY

    switch (setupPiece) {
      case TZAAR_PIECE_SETUP.WHITE_TOTTS:
        piece = TZAAR_PIECE.WHITE_TOTTS
        break
      case TZAAR_PIECE_SETUP.BLACK_TOTTS:
        piece = TZAAR_PIECE.BLACK_TOTTS
        break
      case TZAAR_PIECE_SETUP.WHITE_TZARRAS:
        piece = TZAAR_PIECE.WHITE_TZARRAS
        break
      case TZAAR_PIECE_SETUP.BLACK_TZARRAS:
        piece = TZAAR_PIECE.BLACK_TZARRAS
        break
      case TZAAR_PIECE_SETUP.WHITE_TZAAR:
        piece = TZAAR_PIECE.WHITE_TZAAR
        break
      case TZAAR_PIECE_SETUP.BLACK_TZAAR:
        piece = TZAAR_PIECE.BLACK_TZAAR
        break
    }

    const newPosition: TzaarPosition = {
      value,
      piece,
      allowed: false,
      stackCount: setupPiece === TZAAR_PIECE_SETUP.EMPTY ? 0 : 1,
      pieceNumerical: setupPiece,
      x,
      y,
      z
    }
    return newPosition
  }

  canPlayerUsePosition(x: number, y: number, z: number): boolean {
    return this.currentPlayer.side == this.board[this.posToString(x, y, z)].value
  }

  checkGamePosition(x: number, y: number, z: number, dx: number, dy: number, dz: number) {
    const info = { addPosition: false, position: '' }

    // Not allowed to use middle hex on board (0, 0, 0)
    while (this.isPosWithinBoard(x, z) && !(x === 0 && y === 0 && z === 0)) {
      if (this.board[this.posToString(x, y, z)].value !== EMPTY_POSITION) {
        info.position = this.posToString(x, y, z)
        info.addPosition = true

        break
      }
      x += dx
      y += dy
      z += dz
    }

    return info
  }

  proceedToNextMoveOrPlayer() {
    // Rule white first move, can only do one action and has to be a capture
    if (this.firstMove) {
      this.currentPlayer = this.getOtherPlayer()
      this.firstMove = false
    } else if (this.currentAction === ACTION.FIRST) {
      this.currentAction = ACTION.SECOND
    } else {
      this.currentAction = ACTION.FIRST
      this.currentPlayer = this.getOtherPlayer()
    }
  }

  capture(fromX: number, fromY: number, fromZ: number, x: number, y: number, z: number) {
    const fromPosition = this.board[`${fromX},${fromY},${fromZ}`]
    const toPosition = this.board[this.posToString(x, y, z)]

    this.remainingPieces[toPosition.pieceNumerical - 1]--

    let text = ''

    if (fromPosition.value === toPosition.value) {
      toPosition.stackCount += fromPosition.stackCount
      toPosition.value = fromPosition.value
      text = `Increase strength at new position, stack count ${toPosition.stackCount}`
    } else {
      toPosition.stackCount = fromPosition.stackCount
      toPosition.value = this.currentPlayer.side
      text = `Captured piece`
    }

    toPosition.pieceNumerical = fromPosition.pieceNumerical
    toPosition.piece = fromPosition.piece
    fromPosition.piece = TZAAR_PIECE.EMPTY
    fromPosition.pieceNumerical = TZAAR_PIECE_SETUP.EMPTY
    fromPosition.stackCount = 0
    fromPosition.value = EMPTY_POSITION
    this.addMessageLog(
      `${this.currentPlayer.side} from ${fromX},${fromY},${fromZ} to ${x},${y},${z}. ${text}`
    )
  }

  movePeaceToStep(fromX: number, fromY: number, fromZ: number, x: number, y: number, z: number) {
    // Have to compare against null since position can be 0
    if (
      this.currentLegalMoves.find((pos) => pos === this.posToString(x, y, z)) &&
      this.fromX !== null &&
      this.fromY !== null &&
      this.fromZ !== null
    ) {
      this.capture(this.fromX, this.fromY, this.fromZ, x, y, z)

      this.resetMove()
      this.checkEndGame()
      this.proceedToNextMoveOrPlayer()
    }
  }

  movePeaceFromStep(x: number, y: number, z: number) {
    if (this.canPlayerUsePosition(x, y, z)) {
      let tempLegalMoves = this.findPositions(x, y, z)

      if (tempLegalMoves.length === 0) return

      const otherPlayer = this.getOtherPlayer()

      // Filter out current player positions from first action
      tempLegalMoves =
        this.currentAction === ACTION.FIRST
          ? tempLegalMoves.filter((item) => otherPlayer.side === this.board[item].value)
          : tempLegalMoves

      // Filter out opponent positions with taller stackCount regardless of action
      this.currentLegalMoves = tempLegalMoves.filter(
        (item) =>
          this.board[this.posToString(x, y, z)].stackCount >= this.board[item].stackCount ||
          this.board[item].value === this.currentPlayer.side
      )

      if (this.currentLegalMoves.length === 0) return

      this.prepareLocationTo(x, y, z)
    }
  }

  public clicked(x: number, y: number, z: number) {
    if (this.gameState == GAME_STATE.IN_PROGRESS) {
      if (this.currentPlayerStep === PLAYER_STEP.LOCATION_FROM) {
        this.movePeaceFromStep(x, y, z)
      } else if (x === this.fromX && y === this.fromY && z === this.fromZ) {
        this.resetMove()
      } else if (this.currentPlayerStep === PLAYER_STEP.LOCATION_TO) {
        this.movePeaceToStep(this.fromX!, this.fromY!, this.fromZ!, x, y, z)
      }
    }
  }

  /**
   *
   * Import the games state
   *
   */
  setGameState(gameData: TzaarGameData) {
    super.setGameState(gameData)
    this.currentAction = gameData.currentAction
    this.remainingPieces = gameData.remainingPieces
    this.firstMove = gameData.firstMove
  }

  getGameState(): TzaarGameData {
    const gameState = {
      ...super.getGameState(),
      currentAction: this.currentAction,
      remainingPieces: this.remainingPieces,
      firstMove: this.firstMove
    }

    return JSON.parse(JSON.stringify(gameState))
  }

  static createRandomLocatedPieces(): TzaarPieceSetup[] {
    const shuffledPieces = [
      ...Array(6).fill(TZAAR_PIECE_SETUP.WHITE_TZAAR),
      ...Array(9).fill(TZAAR_PIECE_SETUP.WHITE_TZARRAS),
      ...Array(15).fill(TZAAR_PIECE_SETUP.WHITE_TOTTS),
      ...Array(6).fill(TZAAR_PIECE_SETUP.BLACK_TZAAR),
      ...Array(9).fill(TZAAR_PIECE_SETUP.BLACK_TZARRAS),
      ...Array(15).fill(TZAAR_PIECE_SETUP.BLACK_TZAAR)
    ].sort(() => 0.5 - Math.random())

    shuffledPieces.splice(30, 0, 0)

    return shuffledPieces
  }

  /**
   *
   * Convert position, y: number, z: number to Dvonn notation [letter, number]
   *
   */
  convertIndexToBoardNotation(y: number, z: number) {
    return `${ALPHABET[4 - z]}${y + 5}`
  }

  getGameType(): GameType {
    return TzaarGame.gameType
  }

  shouldUpdate(): boolean {
    return this.currentPlayerStep === PLAYER_STEP.LOCATION_TO
  }
}
