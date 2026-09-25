import dotenv from 'dotenv';
dotenv.config();

import { seedDemoData } from '../seed/demoData.js';

async function run() {
  console.log('====================================================');
  console.log(' MailTrace AI — Safe Demo Data Seeding Script');
  console.log('====================================================');

  try {
    const result = await seedDemoData({
      allowDemoSeed: process.env.ALLOW_DEMO_SEED === 'true'
    });

    console.log(`✅ ${result.message}`);
    console.log(`📌 Seeded ${result.count} DEMO investigation cases with extracted indicators & evidence.`);
    console.log(`⚠️ All records contain is_demo = true and source = 'DEMO_DATA'.`);
    console.log('====================================================');
    process.exit(0);
  } catch (err: any) {
    console.error(`❌ Seeding failed: ${err.message}`);
    process.exit(1);
  }
}

run();
