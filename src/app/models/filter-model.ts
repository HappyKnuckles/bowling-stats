export interface Filter {
  isPractice: boolean;
  minScore: number;
  maxScore: number;
  isClean: boolean;
  isPerfect: boolean;
  startDate?: string;
  endDate?: string;
}
