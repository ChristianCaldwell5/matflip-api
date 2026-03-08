import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyController } from './daily.controller';
import { DailyService } from './daily.service';
import { DailyEntry, DailyEntrySchema } from './schemas/daily-entry.schema';
import { AuthService } from 'src/auth/auth.service';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: DailyEntry.name, schema: DailyEntrySchema }]),
        UsersModule,
    ],
    controllers: [DailyController],
    providers: [DailyService, AuthService],
    exports: [DailyService],
})
export class DailyModule {}
