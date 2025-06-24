// node updateDelete.js
// node queries.js 
// node seed.js   
import { MongoClient, ObjectId } from 'mongodb';
import { faker } from '@faker-js/faker';
import { performance } from 'node:perf_hooks';
import dotenv from 'dotenv';
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

(async () => {
  await client.connect();
  const db = client.db('arenacontrol');
  const games   = db.collection('games');
  const reports = db.collection('matchReports');

  // ---------- INSERIR 1 000 JOGOS ----------
  const t0 = performance.now();
  const bulkGames = [], bulkReports = [];

  for (let i = 0; i < 1000; i++) {
    const _id = new ObjectId();

    // Data do jogo (entre agora e os últimos 90 dias)
    const gameTime = faker.date.recent({ days: 90 });

    // Data da súmula (entre +1 minuto e +1 hora após o jogo)
    const delayMs = faker.number.int({ min: 60_000, max: 3_600_000 }); // 1min a 1h
    const reportTime = new Date(gameTime.getTime() + delayMs);

    bulkGames.push({
      _id,
      datetime: gameTime,
      teamA: faker.company.name(),
      teamB: faker.company.name(),
      scoreboard: {
        ptsA: faker.number.int({ min: 0, max: 30 }),
        ptsB: faker.number.int({ min: 0, max: 30 }),
        faltasA: faker.number.int({ min: 0, max: 15 }),
        faltasB: faker.number.int({ min: 0, max: 15 }),
        periodo: faker.number.int({ min: 1, max: 4 })
      },
      createdByUserId: 1
    });

    bulkReports.push({
      gameId: _id,
      datetime: reportTime,
      sport: 'Futsal',
      competition: 'Interno CEFET',
      categoria: 'Adulto',
      local: 'Ginásio CEFET-MG',
      cidade: 'Leopoldina',
      referee: faker.person.fullName(),
      createdByUserId: 1
    });
  }

  await games.insertMany(bulkGames);
  await reports.insertMany(bulkReports);
  console.log('Insert - 1000 docs – ms:', performance.now() - t0);

  await client.close();
})();
