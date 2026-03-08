import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { DailyModule } from './daily/daily.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `src/environments/env.${process.env.NODE_ENV || 'development'}.local`,
        `src/environments/env.${process.env.NODE_ENV || 'development'}`,
        // Fallbacks if you ever move files to project root
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
      expandVariables: true,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    DailyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
