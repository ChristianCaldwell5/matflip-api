import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyController } from './daily.controller';
import { DailyService } from './daily.service';
import { DailyResultsService } from './services/daily-results.service';
import { DailyEntry, DailyEntrySchema } from './schemas/daily-entry.schema';
import { HistoricalDailyEntry, HistoricalDailyEntrySchema } from './schemas/historical-daily-entry.schema';
import { AuthService } from 'src/auth/auth.service';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DailyEntry.name, schema: DailyEntrySchema },
            { name: HistoricalDailyEntry.name, schema: HistoricalDailyEntrySchema },
        ]),
        UsersModule,
    ],
    controllers: [DailyController],
    providers: [DailyService, DailyResultsService, AuthService],
    exports: [DailyService],
})
export class DailyModule {}
