import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoService } from './mongo.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const uri = config.get<string>('MONGO_URI');
        const dbName = config.get<string>('MONGO_DB');
        if (!uri) {
          throw new Error('MONGO_URI is not set');
        }
        return {
          uri,
          dbName,
          serverSelectionTimeoutMS: 5000,
        };
      },
    }),
  ],
  providers: [MongoService],
  exports: [MongoService, MongooseModule],
})
export class DatabaseModule {}
