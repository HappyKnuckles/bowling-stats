export interface Filter {
  excludePractice: boolean;
  minScore: number;
  maxScore: number;
  isClean: boolean;
  isPerfect: boolean;
  league: string;
  startDate?: string;
  endDate?: string;
}
