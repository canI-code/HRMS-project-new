import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

async function main() {
  const email = process.env.TEST_EMAIL || 'admin@example.com';
  const password = process.env.TEST_PASSWORD || 'Admin123!';
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/enterprise-hrms';

  const client = await MongoClient.connect(mongoUri.replace(/\/$/, ''));
  const dbName = mongoUri.split('/').pop() || 'enterprise-hrms';
  const db = client.db(dbName);

  const user = await db.collection('users').findOne({ email });
  if (!user) {
    console.error('User not found');
    await client.close();
    process.exit(2);
  }

  const ok = await bcrypt.compare(password, user.password);
  console.log(JSON.stringify({ email, ok }, null, 2));
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
