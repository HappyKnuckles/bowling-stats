export interface Game {
  gameId: string;
  date: number;
  frames: any; // Replace 'any' with the appropriate type if known
  totalScore: number;
  frameScores: number[];
  isSeries?: boolean;
  seriesId?: string;
  note?: string;
}

// interface Session {
//   isSeries?: boolean;
//   seriesId?: string;
//   note?: string;
// }

// TODO adjust code to use frame interface instead

// interface Frames {
//     frameIndex: number;
//     throws: Throws[];
// }

// export interface Throws {
//     throwIndex: number;
//     value: number;
// }

// export type ThrowsArray = [Throws, Throws];

// export interface Game {
//     gameId: string;
//     date: number;
//     frames: Frames[];
//     totalScore: number;
//     frameScores: number[];
// }
