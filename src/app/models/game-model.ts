export interface Game{
    gameId: string;
    date: string;
    frames: any; // Replace 'any' with the appropriate type if known
    totalScore: number;
    frameScores: number[];
}