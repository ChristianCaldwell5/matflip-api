import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Support GIS redirect POSTs that use application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  // Cookies and CORS for cross-site redirect/login
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.UI_ORIGIN || true,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
