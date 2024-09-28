import {
  BaseGame,
  EMPTY_POSITION,
  GAMES_SIDE,
  GAME_STATE,
  GAME_TYPES,
  PLAYER_STEP,
  ADJ_POSITIONS,
  ALPHABET
} from './BaseGame.js'

import type {
  BasePosition,
  EmptyPosition,
  GameSide,
  BaseGameData,
  ObjectValues,
  GameType,
  Comparator
} from './BaseGame.js'

/**
 *
 * GENERAL GAME INFO
 *
 * Rows are 5 - 6 - 7 - 8 - 7 - 6 - 5 length
 * Simple game 3 pieces on board 12 in hand
 * Standard game 6 pieces on board (3 GIPF) and 12 in hand
 *
 *
 * TO DOs
 *
 * Improve algorithm for finding matching rows, should not go over all board
 * but just position connected to selected.
 *
 */

export const standardSimpleBoard: GipfPieceSetup[][] = [
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

export const standardDefaultBoard: GipfPieceSetup[][] = [
  [0, 0, 0, 0, 0],
  [0, 1, 0, 0, 2, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 2, 0],
  [0, 0, 0, 0, 0]
]

export const testBoard: GipfPieceSetup[][] = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 2, 1, 1, 0],
  [0, 0, 0, 0, 2, 0, 1, 0],
  [0, 1, 2, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0]
]

export const GIPF_BOARD_SETUP = {
  BASIC: 'basic',
  STANDARD: 'standard'
} as const

export type GipfBoardSetup = ObjectValues<typeof GIPF_BOARD_SETUP>

export const GIPF_PIECE_SETUP = {
  EMPTY: 0,
  WHITE: 1,
  BLACK: 2
} as const

export const MIN_LENGTH_CLEAR_ROW = 4

export const equals = <T>(a: T, b: T) => a === b
export const notEquals = <T>(a: T, b: T) => a !== b

export type GipfPieceSetup = ObjectValues<typeof GIPF_PIECE_SETUP>

export type GipfLocation = GameSide | EmptyPosition

export type GipfPosition = BasePosition & {
  value: GipfLocation
  isGipfPiece: boolean
  isInCompleteRow: boolean
}

export type PiecesLeft = { [key in GameSide]: number }

export type GipfGameData = BaseGameData<GipfPosition> & {
  piecesLeft: PiecesLeft
  selectableRows: string[][]
  clearableRows: string[][]
  streaks: string[][]
  capturedStreaks: string[][]
  intersections: string[]
  gipfPositions: GipfOwner[] // Rename?
  capturedGipfs: string[]
  tempPlayerSwitch: boolean
  standardMode: boolean
  canSkipGipf: boolean
}

export type KeyPositionList = {
  [key: string]: string[]
}

export type GipfOwner = {
  player: GipfLocation
  pos: string
}

export class GipfGame extends BaseGame<GipfPosition, GipfPieceSetup, GipfGameData> {
  board: { [key: string]: GipfPosition }
  piecesLeft: { [key in GameSide]: number }
  selectableRows: string[][]
  clearableRows: string[][]
  canSkipGipf: boolean
  streaks: string[][]
  capturedStreaks: string[][]
  intersections: Set<string>
  gipfPositions: GipfOwner[]
  capturedGipfs: string[]
  tempPlayerSwitch: boolean
  standardMode: boolean
  static gameType: GameType = GAME_TYPES.GIPF

  constructor(
    boardSetup: GipfBoardSetup = GIPF_BOARD_SETUP.STANDARD,
    gameName?: string,
    gameId?: string,
    playerIds?: [string, string],
    playerNames?: [string, string]
  ) {
    super(gameName, gameId, playerIds, playerNames)

    this.board = {}
    this.piecesLeft = { white: 12, black: 12 } // 15 total each, 3 in play, 12 in hand
    this.selectableRows = []
    this.clearableRows = []
    this.canSkipGipf = false
    this.streaks = []
    this.capturedStreaks = []
    this.gipfPositions = []
    this.capturedGipfs = []
    this.intersections = new Set<string>()
    this.tempPlayerSwitch = false
    this.standardMode = boardSetup === GIPF_BOARD_SETUP.STANDARD
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

    // TO DO set this back
    // this.createBoard(this.standardMode ? standardDefaultBoard : standardSimpleBoard)
    this.createBoard(testBoard)
  }

  public createPosition(piece: GipfPieceSetup, x: number, y: number, z: number): GipfPosition {
    let value: GipfLocation = EMPTY_POSITION

    // This is not actually used in default game state no non-gipf pieces, but used for testing
    switch (piece) {
      case GIPF_PIECE_SETUP.WHITE:
        value = GAMES_SIDE.WHITE
        break
      case GIPF_PIECE_SETUP.BLACK:
        value = GAMES_SIDE.BLACK
        break
    }

    // const GIPF_PIECES_START = ['0,3,-3', '3,0,-3', '-3,3,0', '3,-3,0', '-3,0,3', '0,-3,3']
    const GIPF_PIECES_START = ['3,-2,-1']

    const newPosition: GipfPosition = {
      value,
      allowed: false,
      isGipfPiece: this.standardMode && GIPF_PIECES_START.includes(this.posToString(x, y, z)),
      isInCompleteRow: false,
      x,
      y,
      z
    }

    return newPosition
  }

  checkGamePosition(x: number, y: number, z: number): { addPosition: boolean; position: string } {
    return {
      addPosition: this.isPosWithinBoard(x, z) && !this.isPositionOnBoardEdge(x, y, z),
      position: this.posToString(x, y, z)
    }
  }

  isPositionOnBoardEdge(x: number, y: number, z: number): boolean {
    if (z === this.Z_LIMITS[0] || z === this.Z_LIMITS[1]) {
      return true
    }

    const [lowerlimit, upperlimit] = this.Z_TO_X_LIMITS[z]

    return x === lowerlimit || x === upperlimit
  }

  canPlayerUsePosition(x: number, y: number, z: number): boolean {
    this.selectableRows = []
    let pieaceCanMove = false

    const positions = this.findPositions(x, y, z)

    // Convoluted solution to calculate delta since dont want to touch findPosition in Base class
    const positionNumber = positions.map((key) => key.split(',').map(Number))

    const delta = positionNumber.map((row) => [row[0] - x, row[1] - y, row[2] - z])

    const tempCurrentLegalMoves = []

    for (let i = 0; i < positions.length; i++) {
      let xNew = x + delta[i][0]
      let yNew = y + delta[i][1]
      let zNew = z + delta[i][2]

      const currentDirectionPos = []

      currentDirectionPos.push(this.posToString(xNew, yNew, zNew))

      // Add all empty position in the direction (not on board edge)
      while (
        !this.isPositionOnBoardEdge(xNew, yNew, zNew) &&
        this.board[`${xNew},${yNew},${zNew}`].value !== EMPTY_POSITION
      ) {
        xNew += delta[i][0]
        yNew += delta[i][1]
        zNew += delta[i][2]

        currentDirectionPos.push(this.posToString(xNew, yNew, zNew))
      }

      // If position existed that is not board edge, there is a valid move - save it
      if (
        !this.isPositionOnBoardEdge(xNew, yNew, zNew) &&
        this.board[`${xNew},${yNew},${zNew}`].value === EMPTY_POSITION
      ) {
        this.selectableRows.push(currentDirectionPos)

        tempCurrentLegalMoves.push(`${x + delta[i][0]},${y + delta[i][1]},${z + delta[i][2]}`)
        pieaceCanMove = true
      }

      this.currentLegalMoves = tempCurrentLegalMoves
    }

    return pieaceCanMove
  }

  getRowSequence(
    x: number,
    y: number,
    z: number,
    index: number,
    check: GipfLocation,
    comparator: Comparator<GipfLocation>,
    sign: 1 | -1 = 1
  ) {
    if (this.board[this.posToString(x, y, z)].value === EMPTY_POSITION) {
      return []
    }

    const [xDir, yDir, zDir] = ADJ_POSITIONS[index].map((value) => value * sign)

    let xNew = x + xDir
    let yNew = y + yDir
    let zNew = z + zDir

    const currentSequence: string[] = [this.posToString(x, y, z)]

    while (
      this.isPosWithinBoard(xNew, yNew) &&
      comparator(this.board[this.posToString(xNew, yNew, zNew)].value, check)
    ) {
      currentSequence.push(this.posToString(xNew, yNew, zNew))

      xNew += xDir
      yNew += yDir
      zNew += zDir
    }

    return currentSequence
  }

  skipRemovingGipfPieces() {
    if (this.canSkipGipf) {
      if (this.streaks.length) {
        this.gipfPositions = this.gipfPositions.filter(
          (item) => item.player !== this.currentPlayer.side
        )

        this.tempPlayerSwitch = true
      } else {
        this.resetMove()
      }

      this.proceedToNextPlayer()
      this.updatePositionMarks()
    }
  }

  findGipfCapture() {
    // TO DO do I need to worry about intersecting gipf piece
    this.clearableRows.forEach((row, index) => {
      row.forEach((position) => {
        if (this.board[position].isGipfPiece) {
          this.gipfPositions.push({
            player: this.board[this.streaks[index][0]].value,
            pos: position
          })
        }
      })
    })
  }

  findIntersections() {
    const frequencyMap: { [key: string]: number } = {}

    for (const str of this.streaks.flat()) {
      if (frequencyMap[str]) {
        frequencyMap[str]++
      } else {
        frequencyMap[str] = 1
      }
    }

    this.intersections = new Set(Object.keys(frequencyMap).filter((key) => frequencyMap[key] > 1))
  }

  findCompleteRows() {
    this.capturedStreaks = []
    this.clearableRows = []
    this.streaks = []

    const tempStreaks: KeyPositionList = {}
    const tempClearableRow: KeyPositionList = {}

    for (const key in this.board) {
      // This work also with edges since always empty
      if (this.board[key].value === EMPTY_POSITION) continue

      const [x, y, z] = key.split(',').map(Number)

      // Direction                Constant    Key format and direction values
      // Downwards going right       x         0,-1,1:-x
      // Upwards to right            y         1,0,-1:-y
      // Diagonally going right      z         1,-1,0:-z

      for (let i = 0; i < 6; i = i + 2) {
        const currentSequence = this.getRowSequence(x, y, z, i, this.board[key].value, equals)

        if (currentSequence.length >= MIN_LENGTH_CLEAR_ROW) {
          let value = 0

          if (i === 0) value = y
          else if (i === 2) value = z
          else if (i === 4) value = x

          const key = `${ADJ_POSITIONS[i].join(',')}:${value}`

          if (tempStreaks[key]) {
            if (currentSequence.length > tempStreaks[key].length) {
              tempStreaks[key] = currentSequence
            }
          } else {
            tempStreaks[key] = currentSequence

            const direction1 = this.getRowSequence(x, y, z, i, EMPTY_POSITION, notEquals)

            const direction2 = this.getRowSequence(
              x + -1 * ADJ_POSITIONS[i][0],
              y + -1 * ADJ_POSITIONS[i][1],
              z + -1 * ADJ_POSITIONS[i][2],
              i,
              EMPTY_POSITION,
              notEquals,
              -1
            )

            tempClearableRow[key] = [...direction2.reverse(), ...direction1]
          }
        }
      }
    }
    for (const key in tempStreaks) {
      this.streaks.push(tempStreaks[key])
      this.clearableRows.push(tempClearableRow[key])
    }
  }

  updatePositionMarks() {
    for (const key in this.board) {
      this.board[key].isInCompleteRow = false
    }

    // Logic - normal pieces selected or not
    this.clearableRows.forEach((row) => {
      row.forEach((cell) => {
        const { x, y, z } = this.board[cell]
        const currentSide = this.board[cell].value
        const pos = this.posToString(x, y, z)

        if (
          !this.intersections.has(pos) &&
          !this.board[cell].isGipfPiece &&
          currentSide === this.currentPlayer.side
        ) {
          this.board[cell].isInCompleteRow = true
        }
      })
    })

    // Logic - GIPF pieces selected or not
    this.gipfPositions.forEach((item) => {
      if (item.player === this.currentPlayer.side) {
        const { x, y, z } = this.board[item.pos]
        const pos = this.posToString(x, y, z)
        this.board[pos].isInCompleteRow = true
      }
    })
  }

  removeRows(index: number) {
    this.clearableRows = this.clearableRows.filter((row, i) => i !== index)
    this.streaks = this.streaks.filter((row, i) => i !== index)
  }

  captureRowOrGipfAndRemove(x: number, y: number, z: number) {
    const pos = this.posToString(x, y, z)

    // Find index of clicked row
    const index = this.clearableRows.findIndex((row) => row.some((position) => position === pos))

    // Deal with normal pieaces in row
    if (
      index !== -1 &&
      !this.intersections.has(pos) &&
      !this.board[pos].isGipfPiece &&
      this.streaks[index].some((position) => this.board[position].value === this.currentPlayer.side)
    ) {
      let regained = 0
      let captured = 0

      this.clearableRows[index].forEach((key) => {
        if (!this.board[key].isGipfPiece) {
          if (this.board[key].value == this.currentPlayer.side) {
            regained += 1
          } else if (this.board[key].value != EMPTY_POSITION) {
            captured += 1
          }

          this.board[key].value = EMPTY_POSITION
        }
      })

      this.piecesLeft[this.currentPlayer.side] += regained

      const currentStreak = this.streaks[index].slice()

      // Remove GIPF pieces if they where in intersection where 2 rows are removed
      this.capturedStreaks.forEach((row) => {
        const set = new Set(row)

        const position = currentStreak.find((value) => set.has(value))

        this.gipfPositions = this.gipfPositions.filter((item) => item.pos !== position)
      })

      this.capturedStreaks.push(currentStreak)

      // Remove row clicked
      this.removeRows(index)

      // Remove rows that are no longer long enough
      this.streaks.forEach((row, index) => {
        const whiteCount = row.filter((pos) => this.board[pos].value === GAMES_SIDE.WHITE).length
        const blackCount = row.filter((pos) => this.board[pos].value === GAMES_SIDE.BLACK).length

        const isRowRemovable =
          whiteCount < MIN_LENGTH_CLEAR_ROW && blackCount < MIN_LENGTH_CLEAR_ROW

        if (isRowRemovable) {
          this.removeRows(index)
        }
      })
      this.addMessageLog(
        `${this.currentPlayer.side} regained ${regained} ${
          captured ? `and captured ${captured}.` : `.`
        }`
      )
    } else if (
      this.gipfPositions.some((item) => item.pos === pos && item.player === this.currentPlayer.side)
    ) {
      if (this.board[pos].value === this.currentPlayer.side) {
        this.piecesLeft[this.currentPlayer.side] += 2
        this.addMessageLog(
          `${this.currentPlayer.side} captured GIPF-pieces from ${this.board[pos].value}`
        )
      }

      this.board[pos].value = EMPTY_POSITION
      this.board[pos].isGipfPiece = false

      this.gipfPositions = this.gipfPositions.filter((item) => item.pos !== pos)

      this.capturedGipfs.push(pos)

      // Remove rows intersecting with GIPF position if row has previously been removed
      const set = new Set(this.capturedStreaks.flat())
      if (set.has(pos)) {
        this.streaks.forEach((row, index) => {
          if (row.includes(pos)) {
            this.removeRows(index)
          }
        })
      }
    }
  }

  /**
   * Find index in currentLegalMoves of position going to and select corresponding selectableRows
   * Then perform move peaces and insert current player peace
   *
   */
  movePeaceToStep(x: number, y: number, z: number) {
    const moveIndex = this.currentLegalMoves.findIndex((pos) => pos === this.posToString(x, y, z))

    const row = this.selectableRows[moveIndex]

    row
      .reverse()
      .slice(0, -1)
      .forEach((position, i) => {
        const nextPosition = row[i + 1]

        this.board[position].value = this.board[nextPosition].value
        this.board[position].isGipfPiece = this.board[nextPosition].isGipfPiece
      })

    // Add current player peace
    this.board[row[row.length - 1]].value = this.currentPlayer.side
    this.board[row[row.length - 1]].isGipfPiece = false

    this.piecesLeft[this.currentPlayer.side] += -1
    this.addMessageLog(`${this.currentPlayer.side} to ${x},${y},${z}.`)

    this.selectableRows = []
  }

  endTheGame() {
    this.gameState = GAME_STATE.COMPLETED
    this.winner = this.currentPlayer
    this.addMessageLog(`Game side ${this.winner.side} wins.`)
  }

  proceedToNextPlayer() {
    const nextPlayer =
      this.currentPlayer.id === this.players[0].id ? this.players[1] : this.players[0]

    // If next player does not have any peces left, end the game
    if (this.piecesLeft[nextPlayer.side] === 0) {
      this.endTheGame()
    } else {
      this.currentPlayer = nextPlayer
    }
  }

  movePeaceFromStep(x: number, y: number, z: number) {
    if (this.isPositionOnBoardEdge(x, y, z) && this.canPlayerUsePosition(x, y, z)) {
      this.prepareLocationTo(x, y, z)
    }
  }

  checkIfSwitchPlayer() {
    this.canSkipGipf = false
    if (!this.streaks.length && this.tempPlayerSwitch) {
      return
    }

    // If there are still uncaptured rows for currenct player - do not switch
    let switchPlayer = !this.streaks.some(
      (row) =>
        row.filter(
          (pos) =>
            this.board[pos].value === this.currentPlayer.side || this.capturedGipfs.includes(pos)
        ).length >= MIN_LENGTH_CLEAR_ROW
    )

    if (!switchPlayer) {
      return
    }

    // If no remaining gipf positions belongs to current player, switch
    switchPlayer = !this.gipfPositions.some((item) => item.player === this.currentPlayer.side)
    if (switchPlayer) {
      this.proceedToNextPlayer()
      this.tempPlayerSwitch = true
    } else {
      // If gipf pieces belonong to current player remains, but players rows are removed, set the option to skip
      this.canSkipGipf = true
    }
  }

  public clicked(x: number, y: number, z: number): void {
    if (this.gameState !== GAME_STATE.IN_PROGRESS) {
      return
    }

    // Clicking same location twice resets move
    if (
      x === this.fromX &&
      y === this.fromY &&
      z === this.fromZ &&
      this.currentPlayerStep === PLAYER_STEP.LOCATION_TO
    ) {
      this.resetMove()
      return
    }

    switch (this.currentPlayerStep) {
      case PLAYER_STEP.CAPTURE_ROW:
        this.captureRowOrGipfAndRemove(x, y, z)

        this.markLegalMoves(false)

        this.checkIfSwitchPlayer()
        this.updatePositionMarks()
        // Clear up and move out of CAPTURE_ROW if nothing left to capture
        if (!this.clearableRows.length && !this.gipfPositions.length) {
          if (!this.tempPlayerSwitch) {
            this.proceedToNextPlayer()
          } else {
            this.tempPlayerSwitch = false
          }

          this.resetMove()
        }
        break
      case PLAYER_STEP.LOCATION_FROM:
        this.movePeaceFromStep(x, y, z)
        break
      case PLAYER_STEP.LOCATION_TO:
        if (this.currentLegalMoves.find((pos) => pos === this.posToString(x, y, z))) {
          this.movePeaceToStep(x, y, z)
          this.findCompleteRows()
          this.findIntersections()
          this.findGipfCapture()

          this.markLegalMoves(false)

          if (this.clearableRows.length) {
            this.currentPlayerStep = PLAYER_STEP.CAPTURE_ROW
            this.checkIfSwitchPlayer()
            this.updatePositionMarks()
          } else {
            this.resetMove() // currentPlayerStep is set in here
            this.proceedToNextPlayer()
          }
        }
    }
  }

  setGameState(gameData: GipfGameData) {
    super.setGameState(gameData)
    this.piecesLeft = gameData.piecesLeft
    this.selectableRows = gameData.selectableRows
    this.clearableRows = gameData.clearableRows
    this.streaks = gameData.streaks
    this.capturedStreaks = gameData.capturedStreaks
    this.intersections = new Set(gameData.intersections)
    this.gipfPositions = gameData.gipfPositions
    this.capturedGipfs = gameData.capturedGipfs
    this.tempPlayerSwitch = gameData.tempPlayerSwitch
    this.standardMode = gameData.standardMode
    this.canSkipGipf = gameData.canSkipGipf
  }

  getGameState(): GipfGameData {
    const gameState = {
      ...super.getGameState(),
      piecesLeft: this.piecesLeft,
      selectableRows: this.selectableRows,
      clearableRows: this.clearableRows,
      streaks: this.streaks,
      capturedStreaks: this.capturedStreaks,
      intersections: [...this.intersections],
      gipfPositions: this.gipfPositions,
      capturedGipfs: this.capturedGipfs,
      tempPlayerSwitch: this.tempPlayerSwitch,
      standardMode: this.standardMode,
      canSkipGipf: this.canSkipGipf
    }

    return JSON.parse(JSON.stringify(gameState))
  }

  /**
   *
   * Convert position, y: number, z: number to Gipf notation [letter, number]
   *
   */
  convertIndexToBoardNotation(y: number, z: number) {
    return `${ALPHABET[4 - y]}${z + 5}`
  }

  getGameType(): GameType {
    return GipfGame.gameType
  }

  shouldUpdate(): boolean {
    return (
      this.currentPlayerStep === PLAYER_STEP.LOCATION_TO ||
      this.currentPlayerStep === PLAYER_STEP.CAPTURE_ROW
    )
  }
}
