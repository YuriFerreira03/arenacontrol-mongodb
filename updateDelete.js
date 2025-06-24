import { MongoClient } from 'mongodb';
import { performance } from 'node:perf_hooks';
import 'dotenv/config';

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = 'arenacontrol';

(async () => {
  await client.connect();
  const games = client.db(dbName).collection('games');

  // Atualizar todos os jogos onde teamA termina com "Inc" para "Time Corrigido"
  let t0 = performance.now();
  const updateResult = await games.updateMany(
    {},
    { $set: { teamA: 'Time Corrigido' } }
  );
  console.log('UPDATE → documentos modificados:', updateResult.modifiedCount, 'Tempo ms:', performance.now() - t0);

  // Deletar todos os jogos anteriores a 01 de janeiro de 2024
  t0 = performance.now();
    const deleteResult = await games.deleteMany({
    "scoreboard.periodo": { $lt: 3 }  // Jogos em período 1 ou 2
    });
  console.log('DELETE → documentos removidos:', deleteResult.deletedCount, 'Tempo ms:', performance.now() - t0);

  await client.close();
})();
