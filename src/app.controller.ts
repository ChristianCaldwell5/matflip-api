import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MongoService } from './database/mongo.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly mongo: MongoService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/db')
  async dbHealth() {
    const ok = await this.mongo.ping();
    return { ok };
  }
}
