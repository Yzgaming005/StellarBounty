import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Bounty } from './entities/bounty.entity';
import { Submission } from './entities/submission.entity';
import { InitSchema1747657200000 } from './migrations/1747657200000-InitSchema';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Bounty, Submission],
      migrations: [InitSchema1747657200000],
      synchronize: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
