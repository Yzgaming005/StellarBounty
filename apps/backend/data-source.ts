import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Bounty } from './src/entities/bounty.entity';
import { Submission } from './src/entities/submission.entity';
import { InitSchema1747657200000 } from './src/migrations/1747657200000-InitSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Bounty, Submission],
  migrations: [InitSchema1747657200000],
  synchronize: false,
});
