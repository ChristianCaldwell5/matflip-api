import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Headers, UnauthorizedException, Req, BadRequestException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCatalogRequest } from './dto/create-catalog-request.dto';
import { CatalogDTO, CatalogItemDTO, toCatalogDTO, toCatalogItemDTO } from './dto/catalog.dto';
import { AuthService } from 'src/auth/auth.service';
import { GetCatalogResponse } from './dto/get-catalog-response.dto';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly authService: AuthService,
  ) {}

  // Add item to catalog - creates catalog if it doesn't exist
  @Post('/items')
  async createItem(
    @Body() createCatalogRequest: CreateCatalogRequest,
    @Headers('x-mat-flip-request') secureHeader?: string,
  ): Promise<CatalogDTO> {
    if (secureHeader !== process.env.MAT_FLIP_X_HEADER) {
      throw new UnauthorizedException('YOU SHOULD NOT BE HERE >:(');
    }
    const updatedCatalog = await this.catalogService.create(createCatalogRequest);
    return toCatalogDTO(updatedCatalog);
  }

  // Update catalog item in a specific catalog
  @Patch('/:catalogName/items/:name')
  async update(
    @Param('catalogName') catalogName: string,
    @Param('name') name: string,
    @Body() updateCatalogRequest: Partial<CreateCatalogRequest>,
  ): Promise<CatalogDTO> {
    const updated = await this.catalogService.update(catalogName, name, updateCatalogRequest);
    if (!updated) {
      throw new NotFoundException(`Catalog ${catalogName} or item ${name} not found`);
    }
    return toCatalogDTO(updated);
  }

  // Remove catalog item from a specific catalog
  @Delete('/:catalogId/items/:itemId')
  async remove(@Param('catalogId') catalogId: string, @Param('itemId') itemId: string): Promise<CatalogDTO> {
    const removed = await this.catalogService.remove(catalogId, itemId);
    if (!removed) {
      throw new NotFoundException(`Catalog ${catalogId} or item ${itemId} not found`);
    }
    return toCatalogDTO(removed);
  }

  // Get all catalogs - no requestedAt timestamp provided in response
  @Get()
  async getAllCatalogs(
    @Req() req: Request,
    @Headers('x-mat-flip-request') secureHeader?: string,
  ): Promise<CatalogDTO[]> {
    const token = (req as any).cookies?.['mf_session'];
    let authorized = false;

    if (secureHeader == process.env.MAT_FLIP_X_HEADER) {
      authorized = true;
    }

    if (!authorized && token) {
      const claims = this.authService.verifySession(token);
      const googleId = claims.sub as string | undefined;
      if (googleId) {
          authorized = true;
      }
    }

    if (!authorized) {
      throw new UnauthorizedException('You must be logged in to view catalogs.');
    }

    const catalogs = await this.catalogService.findAll();
    return catalogs.map(toCatalogDTO);
  }

  // Get specific catalog by name - with requestedAt timestamp
  @Get(':name')
  async getCatalogByName(
    @Param('name') name: string,
    @Req() req: Request,
    @Headers('x-mat-flip-request') secureHeader?: string,
  ): Promise<GetCatalogResponse> {
    const token = (req as any).cookies?.['mf_session'];
    let authorized = false;

    if (secureHeader == process.env.MAT_FLIP_X_HEADER) {
      authorized = true;
    }

    if (!authorized && token) {
      const claims = this.authService.verifySession(token);
      const googleId = claims.sub as string | undefined;
      if (googleId) {
          authorized = true;
      }
    }

    if (!authorized) {
      throw new UnauthorizedException('This is not the catalog you are looking for... is it?');
    }

    const catalog = await this.catalogService.findByName(name);
    if (!catalog) {
      throw new NotFoundException(`Catalog '${name}' not found`);
    }
    return new GetCatalogResponse(
      toCatalogDTO(catalog), new Date()
    );
  }

  @Get('/:catalogName/version')
  async getVersion(
    @Param('catalogName') catalogName: string,
  ): Promise<{ version: number | null }> {
    const version = await this.catalogService.getVersionByName(catalogName);
    if (version === null) {
      throw new NotFoundException(`Catalog with name '${catalogName}' not found`);
    }
    return { version };
  }
}