import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

(async () => {
  await client.connect();
  const db = client.db('arenacontrol');

  await db.collection('games').deleteMany({});
  await db.collection('matchReports').deleteMany({});

  console.log('Collection limpa!');
  await client.close();
})();
