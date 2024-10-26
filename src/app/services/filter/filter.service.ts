import { Injectable } from '@angular/core';
import { Filter } from 'src/app/models/filter-model';
import { Game } from 'src/app/models/game-model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  filters: Filter;
  defaultFilters: Filter = {
    isPractice: false,
    minScore: 0,
    maxScore: 300,
    isClean: false,
    isPerfect: false,
    league: 'all',
    startDate: '',
    endDate: '',
  };
  leagues: string[] = [];
  activeFilterCount: number = 0;
  private filteredGamesSubject = new BehaviorSubject<Game[]>([]);
  filteredGames$ = this.filteredGamesSubject.asObservable();
  private filtersSubject = new BehaviorSubject<Filter>(this.loadInitialFilters());
  filters$ = this.filtersSubject.asObservable();
  constructor() {
    this.filters = this.loadInitialFilters();
  }

  filterGames(games: Game[]): void {
    localStorage.setItem('filter', JSON.stringify(this.filters));
    this.updateActiveFilterCount();

    const filteredGames = games.filter((game) => {
      const formatDate = (date: string) => date.split('T')[0];
      const gameDate = formatDate(new Date(game.date).toISOString());
      const startDate = formatDate(this.filters.startDate!);
      const endDate = formatDate(this.filters.endDate!);
      const isWithinDateRange = gameDate >= startDate && gameDate <= endDate;
      const isWithinScoreRange = game.totalScore >= this.filters.minScore && game.totalScore <= this.filters.maxScore;
      const matchesPracticeFilter = !this.filters.isPractice || game.isPractice;
      const matchesPerfectFilter = !this.filters.isPerfect || game.isPerfect;
      const matchesCleanFilter = !this.filters.isClean || game.isClean;

      let matchesLeagueFilter = true;
      if (this.filters.league !== 'all') {
        matchesLeagueFilter = this.filters.league === game.league;
      }

      return isWithinDateRange && isWithinScoreRange && matchesPracticeFilter && matchesPerfectFilter && matchesCleanFilter && matchesLeagueFilter;
    });

    this.filteredGamesSubject.next(filteredGames);
  }

  resetFilters(): void {
    this.filters = { ...this.defaultFilters };
    this.filtersSubject.next(this.filters);
    this.updateActiveFilterCount();
  }

  setDefaultFilters(games: Game[]): void {
    this.defaultFilters.startDate = new Date(games[games.length - 1].date).toISOString();
    const currentDate = new Date();
    const oneWeekLater = new Date(currentDate.setDate(currentDate.getDate() + 7));
    this.defaultFilters.endDate = oneWeekLater.toISOString();
    this.filters.startDate = this.defaultFilters.startDate;
    this.filters.endDate = this.defaultFilters.endDate;
    this.filtersSubject.next(this.filters);
  }

  updateActiveFilterCount(): void {
    this.activeFilterCount = Object.keys(this.filters).reduce((count, key) => {
      if (this.filters[key as keyof Filter] !== this.defaultFilters[key as keyof Filter]) {
        return count + 1;
      }
      return count;
    }, 0);
  }

  private loadInitialFilters(): Filter {
    const storedFilter = localStorage.getItem('filter');
    return storedFilter ? JSON.parse(storedFilter) : { ...this.defaultFilters };
  }
}
