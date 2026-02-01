import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateCatalogRequest } from './dto/create-catalog-request.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Catalog, CatalogDocument, CatalogItem } from './schemas/catalog.schema';
import { Model } from 'mongoose';
import type { Cache } from 'cache-manager';

@Injectable()
export class CatalogService {

  constructor(
    @InjectModel(Catalog.name) private readonly catalogModel: Model<CatalogDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Append a new catalog item to the specified catalog by name.
   * If the catalog does not exist, it will be created.
   */
  create(createCatalogRequest: CreateCatalogRequest) {
    const { catalogName, ...itemFields } = createCatalogRequest;
    const item: CatalogItem = {
      ...(itemFields as any),
      version: 1,
    } as CatalogItem;

    // Invalidate related caches
    void this.cacheManager.del('catalog:all');
    void this.cacheManager.del(`catalog:${catalogName}`);

    return this.catalogModel.findOneAndUpdate(
      { name: catalogName },
      {
        $setOnInsert: { name: catalogName, version: 1 },
        $push: { items: item },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  }

  // find all catalogs and cache results for 5 minutes
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

  async findByName(name: string): Promise<CatalogDocument | null> {
    const cacheKey = `catalog:${name}`;
    const cached = await this.cacheManager.get<CatalogDocument>(cacheKey);
    if (cached) {
      return cached;
    }
    const doc = await this.catalogModel.findOne({ name }).exec();
    if (doc) {
      await this.cacheManager.set(cacheKey, doc, 300);
    }
    return doc;
  }

  findOne(id: string): Promise<CatalogDocument | null> {
    return this.catalogModel.findById(id).exec();
  }

  // Get version number of catalog by name
  async getVersionByName(name: string): Promise<number | null> {
    return this.catalogModel.findOne({ name }).select('version').lean().exec()
      .then(doc => doc ? doc.version : null);
  }

  async update(catalogName: string, itemName: string, updateCatalogRequest: Partial<CreateCatalogRequest>) {
    const { catalogName: _, ...rest } = updateCatalogRequest || {};

    // allowed fields to update
    const allowed: (keyof Omit<CreateCatalogRequest, 'catalogName'>)[] = [
      'type',
      'name',
      'displayName',
      'rarity',
      'unlockType',
      'isRetired',
      'styleRecipe',
      'isAnimated',
    ];
    const $set: Record<string, any> = {};
    for (const key of allowed) {
      if ((rest as any)[key] !== undefined) {
        $set[`items.$.${key}`] = (rest as any)[key];
      }
    }

    // Ensure at least one field is being updated
    if (Object.keys($set).length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    // Invalidate cached list when updating an item; clear specific catalog cache after update
    void this.cacheManager.del('catalog:all');

    // Update specific item in catalog
    const updated = await this.catalogModel
      .findOneAndUpdate(
        { name: catalogName, 'items.name': itemName },
        { $set },
        { new: true }
      )
      .exec();

    // remove specific catalog cache after update
    if (updated) {
      const raw: any = (updated as any).toObject ? (updated as any).toObject() : (updated as any);
      if (raw?.name) {
        void this.cacheManager.del(`catalog:${raw.name}`);
      }
    }
    return updated;
  }

  async remove(catalogName: string, itemName: string) {
    // Invalidate cached list when removing an item
    void this.cacheManager.del('catalog:all');
    // Remove specific item from catalog
    const deleted = await this.catalogModel.findOneAndUpdate(
      { name: catalogName },
      { $pull: { items: { name: itemName } } },
      { new: true }
    ).exec();
    // remove specific catalog cache after deletion
    if (deleted) {
      const raw: any = (deleted as any).toObject ? (deleted as any).toObject() : (deleted as any);
      if (raw?.name) {
        void this.cacheManager.del(`catalog:${raw.name}`);
      }
    }
    return deleted;
  }
}
