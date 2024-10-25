export interface Filter {
  isPractice: boolean;
  minScore: number;
  maxScore: number;
  isClean: boolean;
  isPerfect: boolean;
  league: string;
  startDate?: string;
  endDate?: string;
}
