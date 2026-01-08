import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateCatalogRequest } from './dto/create-catalog-request.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Catalog, CatalogAudit, CatalogAuditDocument, CatalogDocument } from './schemas/catalog.schema';
import { Model } from 'mongoose';
import type { Cache } from 'cache-manager';

@Injectable()
export class CatalogService {

  constructor(
    @InjectModel(Catalog.name) private readonly catalogModel: Model<CatalogDocument>,
    @InjectModel(CatalogAudit.name) private readonly catalogAuditModel: Model<CatalogAuditDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  create(createCatalogRequest: CreateCatalogRequest) {
    const createdCatalog = new this.catalogModel(createCatalogRequest);
    // Invalidate cached list when creating a new item
    void this.cacheManager.del('catalog:all');
    return createdCatalog.save();
  }

  // find all catalog items and cache results for 5 minutes
  async findAll(): Promise<CatalogDocument[]> {
    const cacheKey = 'catalog:all';
    const cached = await this.cacheManager.get<CatalogDocument[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const results = await this.catalogModel.find().exec();
    // Store in cache with a TTL of 5 minutes (in seconds)
    await this.cacheManager.set(cacheKey, results, 300);
    return results;
  }

  findOne(id: string): Promise<CatalogDocument | null> {
    return this.catalogModel.findById(id).exec();
  }

  update(id: string, updateCatalogRequest: Partial<CreateCatalogRequest>) {
    // Invalidate cached list when updating an item
    void this.cacheManager.del('catalog:all');
    return this.catalogModel.findByIdAndUpdate(id, updateCatalogRequest).exec();
  }

  remove(id: string) {
    // Invalidate cached list when removing an item
    void this.cacheManager.del('catalog:all');
    return this.catalogModel.findByIdAndDelete(id).exec();
  }

  updateAudit(version: number): Promise<CatalogAuditDocument> {
    return this.catalogAuditModel.findOneAndUpdate(
      {},
      { $set: { version, lastUpdated: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true, strict: false }
    ).exec();
  }

  getAudit(): Promise<CatalogAuditDocument | null> {
    return this.catalogAuditModel.findOne().exec();
  }
}
