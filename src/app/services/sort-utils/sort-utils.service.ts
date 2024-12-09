import { Injectable } from '@angular/core';
import { Game } from 'src/app/models/game-model';

@Injectable({
  providedIn: 'root',
})
export class SortUtilsService {
  constructor() {}

  sortGameHistoryByDate(gameHistory: Game[], up?: boolean): Game[] {
    return gameHistory.sort((a: { date: number }, b: { date: number }) => {
      if (up) {
        return a.date - b.date;
      } else return b.date - a.date;
    });
  }

  sortGamesByLeagues(games: Game[]): { [key: string]: Game[] } {
    const gamesByLeague = games.reduce((acc: { [key: string]: Game[] }, game: Game) => {
      const league = game.league || 'Practice';
      if (!acc[league]) {
        acc[league] = [];
      }
      acc[league].push(game);
      return acc;
    }, {});

    const sortedEntries = Object.entries(gamesByLeague).sort((a, b) => b[1].length - a[1].length);

    return sortedEntries.reduce((acc: { [key: string]: Game[] }, [league, games]) => {
      acc[league] = games;
      return acc;
    }, {});
  }
}
