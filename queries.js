import { MongoClient } from 'mongodb';
import { performance } from 'node:perf_hooks';
import 'dotenv/config';

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = 'arenacontrol';

(async () => {
  await client.connect();
  const db = client.db(dbName);
  const games = db.collection('games');
  const reports = db.collection('matchReports');

  // 1. Qual time venceu mais jogos?
  let t0 = performance.now();
  const mostWins = await games.aggregate([
    {
      $project: {
        winner: {
          $cond: [
            { $gt: ['$scoreboard.ptsA', '$scoreboard.ptsB'] },
            '$teamA',
            {
              $cond: [
                { $gt: ['$scoreboard.ptsB', '$scoreboard.ptsA'] },
                '$teamB',
                null,
              ],
            },
          ],
        },
      },
    },
    { $match: { winner: { $ne: null } } },
    { $group: { _id: '$winner', total: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]).toArray();
  console.log('Q1 – Time com mais vitórias:', mostWins, 'Tempo ms:', performance.now() - t0);

  // 2. Média de gols por jogo
  t0 = performance.now();
  const avgGoals = await games.aggregate([
    {
      $project: {
        totalGols: {
          $add: ['$scoreboard.ptsA', '$scoreboard.ptsB'],
        },
      },
    },
    {
      $group: {
        _id: null,
        media: { $avg: '$totalGols' },
      },
    },
  ]).toArray();
  console.log('Q2 – Média de gols por jogo:', avgGoals, 'Tempo ms:', performance.now() - t0);

  // 3. Quantidade de jogos por mês
  t0 = performance.now();
  const gamesPerMonth = await games.aggregate([
    {
      $group: {
        _id: { $month: '$datetime' },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]).toArray();
  console.log('Q3 – Jogos por mês:', gamesPerMonth, 'Tempo ms:', performance.now() - t0);

  // 4. Jogos com diferença de gols > 5
  t0 = performance.now();
  const diffGames = await games.find({
    $expr: {
      $gt: [
        { $abs: { $subtract: ['$scoreboard.ptsA', '$scoreboard.ptsB'] } },
        5,
      ],
    },
  }).toArray();
  console.log('Q4 – Jogos com diferença > 5 gols:', diffGames.length, 'Tempo ms:', performance.now() - t0);

  // 5. Tempo médio entre criação do jogo e geração da súmula
  t0 = performance.now();
  const avgDelay = await reports.aggregate([
    {
      $lookup: {
        from: 'games',
        localField: 'gameId',
        foreignField: '_id',
        as: 'jogo',
      },
    },
    { $unwind: '$jogo' },
    {
      $project: {
        delayMs: { $subtract: ['$datetime', '$jogo.datetime'] },
      },
    },
    {
      $group: {
        _id: null,
        mediaAtrasoMs: { $avg: '$delayMs' },
      },
    },
  ]).toArray();
  console.log('Q5 – Tempo médio entre jogo e súmula (ms):', avgDelay, 'Tempo ms:', performance.now() - t0);

  await client.close();
})();
