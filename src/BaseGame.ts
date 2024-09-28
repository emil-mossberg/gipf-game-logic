export type ObjectValues<T> = T[keyof T]

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVXYZ'

export const ADJ_POSITIONS: number[][] = [
  [0, 1, -1],
  [0, -1, 1],
  [1, 0, -1],
  [-1, 0, 1],
  [1, -1, 0],
  [-1, 1, 0]
]

export type Comparator<T> = (a: T, b: T) => boolean

export const GAME_TYPES = {
  DVONN: 'dvonn',
  TZAAR: 'tzaar',
  GIPF: 'gipf'
} as const

export type GameType = ObjectValues<typeof GAME_TYPES>

export const GAME_STATE = {
  SETUP: 'setup-state',
  IN_PROGRESS: 'in-progress-state',
  COMPLETED: 'completed-state'
} as const

export type GameState = ObjectValues<typeof GAME_STATE>

export const PLAYER_STEP = {
  LOCATION_FROM: 'location_from',
  LOCATION_TO: 'location_to',
  CAPTURE_ROW: 'capture_row' // TO DO temp solution for gipf, rework to generics
} as const

export type PlayerStep = ObjectValues<typeof PLAYER_STEP>

export const GAMES_SIDE = {
  WHITE: 'white',
  BLACK: 'black'
} as const

export type GameSide = ObjectValues<typeof GAMES_SIDE>

export const EMPTY_POSITION = 'empty'

export type EmptyPosition = typeof EMPTY_POSITION

export type Player = {
  id: string
  name: string
  side: GameSide
}

export type LogEntry = {
  message: string
  date: string
}

export type Winner = Player | 'even' | null

export type BasePosition = {
  allowed: boolean
  // value: GameSide | EmptyPosition
  x: number
  y: number
  z: number
}

export type BaseGameData<T> = {
  currentPlayer: Player
  players: [Player, Player]
  gameName: string
  gameId: string
  gameType: GameType
  currentLegalMoves: string[]
  board: { [key: string]: T }
  gameState: GameState
  currentPlayerStep: PlayerStep
  gameLog: LogEntry[]
  winner: Winner
  fromX: null | number
  fromY: null | number
  fromZ: null | number
}

/**
 * Generics
 *
 * T - Is implementation of a board position
 * K - Is board position in setup matrix
 * L - GameData extended with specific game functionality
 *
 */
export abstract class BaseGame<T extends BasePosition, K, L extends BaseGameData<T>> {
  gameId: string
  currentPlayer: Player
  players: [Player, Player]
  gameName: string
  currentLegalMoves: string[]
  board: { [key: string]: T }
  gameState: GameState
  currentPlayerStep: PlayerStep
  gameLog: LogEntry[]
  winner: Winner
  fromX: null | number
  fromY: null | number
  fromZ: null | number
  Z_TO_X_LIMITS: { [key: string]: [number, number] }
  Z_LIMITS: number[]

  constructor(
    gameName: string = `game-${new Date().toISOString().slice(0, 16)}`,
    gameId: string = Math.random().toString(36).substr(2, 5),
    playerIds: [string, string] = ['1212', '4646'],
    playerNames: [string, string] = ['Player1', 'Player2']
  ) {
    const [id1, id2] = playerIds
    const [name1, name2] = playerNames

    this.players = [
      { id: id1, name: name1, side: GAMES_SIDE.WHITE },
      { id: id2, name: name2, side: GAMES_SIDE.BLACK }
    ]
    this.gameId = gameId
    this.gameName = gameName
    this.currentLegalMoves = []
    this.currentPlayer = this.players[0]
    this.board = {}
    this.gameState = GAME_STATE.IN_PROGRESS
    this.currentPlayerStep = PLAYER_STEP.LOCATION_FROM
    this.fromX = null
    this.fromY = null
    this.fromZ = null
    this.winner = null
    this.gameLog = []
    this.Z_TO_X_LIMITS = {}
    this.Z_LIMITS = []
  }

  /**
   *
   * Abstract methods, will vary between implementation
   *
   */

  abstract getGameType(): GameType
  abstract movePeaceFromStep(x: number, y: number, z: number): void
  abstract canPlayerUsePosition(x: number, y: number, z: number): boolean
  abstract createPosition(value: K, x: number, y: number, z: number): T
  abstract clicked(x: number, y: number, z: number): void
  abstract shouldUpdate(): boolean
  abstract convertIndexToBoardNotation(y: number, z: number): string
  abstract checkGamePosition(
    x: number,
    y: number,
    z: number,
    dx: number,
    dy: number,
    dz: number
  ): { addPosition: boolean; position: string }

  /**
   *
   * TO DO write down all the math how this works
   *
   */
  public createBoard(board: K[][]) {
    const halfLength = Math.floor(board.length / 2) // board.length is same as number of rows in game
    const centeredNumbers = []

    for (let i = halfLength; i >= -halfLength; i--) {
      centeredNumbers.push(i)
    }

    const aNumber = Math.floor(board[halfLength].length / 2) // TO DO investigate why this works

    for (let i = 0; i < board.length; i++) {
      const rowIndex = centeredNumbers[i]
      const isPositive = rowIndex >= 0
      const xStart = isPositive ? -aNumber : aNumber

      for (let j = 0; j < board[i].length; j++) {
        const x = isPositive ? xStart + j : xStart - j
        const z = rowIndex
        const y = -(z + x)
        const key = `${x},${y},${z}`

        const k = i <= halfLength ? j : board[i].length - 1 - j
        const piece = board[board.length - 1 - i][k]

        this.board[key] = this.createPosition(piece, x, y, z)
      }
    }

    const gameName = this.getGameType().charAt(0).toUpperCase() + this.getGameType().slice(1)

    this.addMessageLog(`Started a game of ${gameName}.`)
  }

  public markLegalMoves(markValue: boolean) {
    this.currentLegalMoves.forEach((key) => (this.board[key].allowed = markValue))
  }

  posToString(x: number, y: number, z: number) {
    return `${x},${y},${z}`
  }

  prepareLocationTo(x: number, y: number, z: number) {
    this.fromX = x
    this.fromY = y
    this.fromZ = z

    this.currentPlayerStep = PLAYER_STEP.LOCATION_TO
    this.markLegalMoves(true)
  }

  resetMove() {
    this.currentPlayerStep = PLAYER_STEP.LOCATION_FROM
    this.fromX = this.fromY = this.fromZ = null

    this.markLegalMoves(false)
  }

  getOtherPlayer() {
    return this.currentPlayer.id === this.players[0].id ? this.players[1] : this.players[0]
  }

  calculateZLimits() {
    const zKeys = Object.keys(this.Z_TO_X_LIMITS).map(Number)
    const zMin = Math.min(...zKeys)
    const zMax = Math.max(...zKeys)
    return [zMin, zMax]
  }

  isPosWithinBoard(x: number, z: number): boolean {
    if (z < this.Z_LIMITS[0] || z > this.Z_LIMITS[1]) {
      return false
    }

    const [lowerlimit, upperlimit] = this.Z_TO_X_LIMITS[z]

    return x >= lowerlimit && x <= upperlimit
  }

  populateBoard(board: K[][], list: K[]): K[][] {
    let shuffleIndex = 0
    return board.map((row) =>
      row.map(() => {
        const piece = list[shuffleIndex]
        shuffleIndex++
        return piece
      })
    )
  }

  findPositions(x: number, y: number, z: number, size: number = 1) {
    const positions: string[] = []

    for (let i = 0; i < ADJ_POSITIONS.length; i++) {
      const [dx, dy, dz] = ADJ_POSITIONS[i]

      const xNew = x + dx * size
      const yNew = y + dy * size
      const zNew = z + dz * size
      const { addPosition, position } = this.checkGamePosition(xNew, yNew, zNew, dx, dy, dz)

      if (addPosition) {
        positions.push(position)
      }
    }

    return positions
  }

  getGameState(): BaseGameData<T> {
    const gameData: BaseGameData<T> = {
      currentPlayer: this.currentPlayer,
      players: this.players,
      gameName: this.gameName,
      gameId: this.gameId,
      gameType: this.getGameType(),
      currentLegalMoves: this.currentLegalMoves,
      board: this.board,
      gameState: this.gameState,
      currentPlayerStep: this.currentPlayerStep,
      gameLog: this.gameLog,
      fromX: this.fromX,
      fromY: this.fromY,
      fromZ: this.fromZ,
      winner: this.winner
    }

    return gameData
  }

  setGameState(gameData: BaseGameData<T>) {
    this.currentPlayer = gameData.currentPlayer
    this.players = gameData.players
    this.gameState = gameData.gameState
    this.currentPlayerStep = gameData.currentPlayerStep
    this.board = gameData.board
    this.fromX = gameData.fromX
    this.fromY = gameData.fromY
    this.fromZ = gameData.fromZ
    this.currentLegalMoves = gameData.currentLegalMoves
    this.gameName = gameData.gameName
    this.gameId = gameData.gameId
    this.gameLog = gameData.gameLog
    this.winner = gameData.winner
  }

  addMessageLog(message: string) {
    this.gameLog.push({ date: new Date().toISOString(), message })
  }
}
