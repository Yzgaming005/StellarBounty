import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BountiesController } from './bounties.controller';
import { BountiesService } from './bounties.service';
import { Bounty } from './entities/bounty.entity';
import { Submission } from './entities/submission.entity';
import { InitSchema1747657200000 } from './migrations/1747657200000-InitSchema';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Bounty, Submission]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Bounty, Submission],
      migrations: [InitSchema1747657200000],
      synchronize: false,
    }),
  ],
  controllers: [AppController, BountiesController, SubmissionsController],
  providers: [AppService, BountiesService, SubmissionsService],
})
export class AppModule {}
