export declare function sayHello(name: string): string;
export { BaseGame, GAME_TYPES, PLAYER_STEP, GAMES_SIDE, EMPTY_POSITION, } from './BaseGame.js';
export type { Comparator, GameType, GameState, GameSide, Player, LogEntry, Winner, BasePosition, } from './BaseGame.js';
export { DvonnGame, DVONN_BOARD_SETUP, DVONN_PIECE_SETUP, DVONN, } from './DvonnGame.js';
export type { DvonnBoardSetup, DvonnPieceSetup, DvonnLocation, DvonnBoardLocation, DvonnPosition, DvonnGameData, DvonnGameType, } from './DvonnGame.js';
export { GipfGame, GIPF_BOARD_SETUP, GIPF_PIECE_SETUP } from './GipfGame.js';
export type { GipfBoardSetup, GipfPieceSetup, GipfLocation, PiecesLeft, KeyPositionList, GipfOwner, } from './GipfGame.js';
export { TzaarGame, TZAAR_PIECE_SETUP, TZAAR_PIECE, TZAAR_BOARD_SETUP, } from './TzaarGame.js';
export type { TzaarPieceSetup, TzaarPiece, TzaarBoardLocation, CapturePieces, Action, TzaarPosition, TzaarBoardSetup, } from './TzaarGame.js';
