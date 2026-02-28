import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Catalog, CatalogSchema } from './schemas/catalog.schema';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Catalog.name, schema: CatalogSchema }]),
    // Enable in-memory caching with a default TTL of 5 minutes
    CacheModule.register({ ttl: 300 }),
  ],
  controllers: [CatalogController],
  providers: [CatalogService, AuthService],
  exports: [CatalogService],
})
export class CatalogModule {}
