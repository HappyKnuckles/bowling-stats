/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { gameHistory } = data;
  const stats = calculateStats(gameHistory);
  postMessage(stats);
});

function calculateStats(gameHistory: any[]): any {
  let totalStrikes = 0;
  let totalSpares = 0;
  let totalSparesMissed = 0;
  let totalSparesConverted = 0;
  let pinCounts = Array(11).fill(0);
  let missedCounts = Array(11).fill(0);
  let firstThrowCount = 0;
  let totalScoreSum = 0;
  let highGame = -1;

  gameHistory.forEach(game => {
    game.frames.forEach((frame: any, index: number) => {
      const throws = frame.throws;

      firstThrowCount += parseInt(throws[0].value);

      if (throws[0].value === 10) {
        totalStrikes++;
        if (index === 9 && throws[1]?.value === 10) {
          totalStrikes++;
          if (throws[2]?.value === 10) {
            totalStrikes++;
          }
        }
      } else if (index === 9 && throws.length === 3 && throws[2]?.value === 10) {
        totalStrikes++;
      }

      if (throws.length === 2) {
        if (throws[0].value + throws[1].value === 10) {
          const pinsLeft = 10 - throws[0].value;
          pinCounts[pinsLeft]++;
        } else {
          const pinsLeft = 10 - throws[0].value;
          missedCounts[pinsLeft]++;
        }
      } else if (throws.length === 3) {
        if (throws[0].value !== 10 && throws[0].value + throws[1].value === 10) {
          const pinsLeft = 10 - throws[0].value;
          pinCounts[pinsLeft]++;
        } else if (throws[1].value !== 10 && throws[1].value + throws[2].value === 10) {
          const pinsLeft = 10 - throws[1].value;
          pinCounts[pinsLeft]++;
        }

        if (throws[0].value !== 10 && throws[0].value + throws[1].value !== 10) {
          const pinsLeft = 10 - throws[0].value;
          missedCounts[pinsLeft]++;
        }
        if (throws[1].value !== 10 && throws[1].value + throws[2].value !== 10) {
          const pinsLeft = 10 - throws[1].value;
          missedCounts[pinsLeft]++;
        }
      }
    });

    totalScoreSum += game.totalScore;
    if (game.totalScore > highGame) {
      highGame = game.totalScore;
    }
  });

  for (let i = 1; i <= 10; i++) {
    totalSparesMissed += missedCounts[i] || 0;
    totalSparesConverted += pinCounts[i] || 0;
  }

  totalSpares = totalSparesConverted;
  const totalGames = gameHistory.length;
  const totalFrames = totalGames * 10;
  const strikeChances = totalGames * 12;

  const averageStrikesPerGame = totalStrikes / totalGames;
  const averageSparesPerGame = totalSpares / totalGames;
  const averageOpensPerGame = totalSparesMissed / totalGames;

  const strikePercentage = (totalStrikes / strikeChances) * 100;
  const sparePercentage = (totalSpares / totalFrames) * 100;
  const openPercentage = (totalSparesMissed / totalFrames) * 100;

  const averageFirstCount = firstThrowCount / totalFrames;
  const averageScore = totalScoreSum / totalGames;

  return {
    totalGames,
    averageScore,
    averageFirstCount,
    totalStrikes,
    averageStrikesPerGame,
    strikePercentage,
    totalSpares,
    totalSparesConverted,
    totalSparesMissed,
    averageSparesPerGame,
    sparePercentage,
    averageOpensPerGame,
    openPercentage,
    missedCounts,
    pinCounts,
    highGame
  };
}
