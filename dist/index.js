export function sayHello(name) {
    console.log('console.lasdasd!');
    return `Hessllo, ${name}!`;
}
export { BaseGame, GAME_TYPES, PLAYER_STEP, GAMES_SIDE, EMPTY_POSITION, } from './BaseGame.js';
export { DvonnGame, DVONN_BOARD_SETUP, DVONN_PIECE_SETUP, DVONN, } from './DvonnGame.js';
export { GipfGame, GIPF_BOARD_SETUP, GIPF_PIECE_SETUP } from './GipfGame.js';
export { TzaarGame, TZAAR_PIECE_SETUP, TZAAR_PIECE, TZAAR_BOARD_SETUP, } from './TzaarGame.js';
