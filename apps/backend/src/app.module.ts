import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { BountiesController } from './bounties.controller';
import { BountiesService } from './bounties.service';
import { Bounty } from './entities/bounty.entity';
import { Submission } from './entities/submission.entity';
import { InitSchema1747657200000 } from './migrations/1747657200000-InitSchema';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        STELLAR_NETWORK: Joi.string().valid('testnet', 'mainnet').required(),
        PORT: Joi.number().default(4000),
      }),
    }),
    AuthModule,
    SubmissionsModule,
    HealthModule,
    TypeOrmModule.forFeature([Bounty]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [Bounty, Submission],
        migrations: [InitSchema1747657200000],
        synchronize: false,
      }),
    }),
  ],
  controllers: [AppController, BountiesController, SubmissionsController],
  providers: [AppService, BountiesService, SubmissionsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
