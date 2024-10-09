export interface Stats {
  totalGames: number;
  totalPins: number;
  perfectGameCount: number;
  cleanGameCount: number;
  cleanGamePercentage: number;
  totalStrikes: number;
  totalSpares: number;
  totalSparesMissed: number;
  totalSparesConverted: number;
  pinCounts: number[];
  missedCounts: number[];
  averageStrikesPerGame: number;
  averageSparesPerGame: number;
  averageOpensPerGame: number;
  strikePercentage: number;
  sparePercentage: number;
  openPercentage: number;
  spareConversionPercentage: number;
  averageFirstCount: number;
  averageScore: number;
  highGame: number;
  spareRates: number[];
  overallSpareRate: number;
  overallMissedRate: number;
}
export interface SessionStats extends Stats {
  lowGame: number;
}
export interface PrevStats {
  cleanGamePercentage: number;

  strikePercentage: number;
  sparePercentage: number;
  openPercentage: number;
  averageStrikesPerGame: number;
  averageSparesPerGame: number;
  averageOpensPerGame: number;
  averageFirstCount: number;
  cleanGameCount: number;
  perfectGameCount: number;
  averageScore: number;
  overallSpareRate: number;
  overallMissedRate: number;
  spareRates: number[];
}
