import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Headers, UnauthorizedException, Req, BadRequestException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCatalogRequest } from './dto/create-catalog-request.dto';
import { CatalogDTO, toCatalogDTO } from './dto/catalog.dto';
import { AuthService } from 'src/auth/auth.service';
import { GetCatalogResponse } from './dto/get-catalog-response.dto';
import { CatalogAuditDocument } from './schemas/catalog.schema';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly authService: AuthService,
  ) {}

  // TODO: update authorization logic >:(

  @Get()
  async getCatalogWithAudit(@Req() req: Request, @Headers('x-mat-flip-request') secureHeader?: string): Promise<GetCatalogResponse> {
    const token = (req as any).cookies?.['mf_session'];
    let authorized = false;

    // attempt authorization via secure header first
    if (secureHeader == process.env.MAT_FLIP_X_HEADER) {
      authorized = true;
    }

    // check session cookie if not yet authorized
    if (!authorized && token) {
      const claims = this.authService.verifySession(token);
      // Session `sub` contains the Google ID (from auth.controller)
      const googleId = claims.sub as string | undefined;
      if (googleId) {
          authorized = true;
      }
    }

    if (!authorized) {
      throw new UnauthorizedException('This is not the catalog you are looking for... is it?');
    }
    
    const catalogs = await this.catalogService.findAll();
    const audit = await this.catalogService.getAudit();
    const auditVersion = audit?.toJSON().version;
    
    return {
      catalogItems: catalogs.map(toCatalogDTO),
      version: auditVersion ?? 0,
      requestedAt: new Date(),
    };
  }

  @Get('/items')
  async findAllItems(@Req() req: Request, @Headers('x-mat-flip-request') secureHeader?: string): Promise<CatalogDTO[]> {
    const token = (req as any).cookies?.['mf_session'];
    let authorized = false;

    // attempt authorization via secure header first
    if (secureHeader == process.env.MAT_FLIP_X_HEADER) {
      authorized = true;
    }

    // check session cookie if not yet authorized
    if (!authorized && token) {
      const claims = this.authService.verifySession(token);
      // Session `sub` contains the Google ID (from auth.controller)
      const googleId = claims.sub as string | undefined;
      if (googleId) {
          authorized = true;
      }
    }

    if (!authorized) {
      throw new UnauthorizedException('This is not the catalog you are looking for... is it?');
    }
    
    const catalogs = await this.catalogService.findAll();
    return catalogs.map(toCatalogDTO);
  }

  @Post('/items')
  async createItem(
    @Body() createCatalogRequest: CreateCatalogRequest,
    @Headers('x-mat-flip-request') secureHeader?: string,
  ): Promise<CatalogDTO> {
    if (secureHeader !== process.env.MAT_FLIP_X_HEADER) {
      throw new UnauthorizedException('YOU SHOULD NOT BE HERE >:(');
    }
    const created = await this.catalogService.create(createCatalogRequest);
    return toCatalogDTO(created);
  }

  @Get('/items/:id')
  async findOne(@Param('id') id: string): Promise<CatalogDTO> {
    const catalog = await this.catalogService.findOne(id);
    if (!catalog) {
      throw new NotFoundException(`Catalog ${id} not found`);
    }
    return toCatalogDTO(catalog);
  }

  @Patch('/items/:id')
  async update(
    @Param('id') id: string,
    @Body() updateCatalogRequest: Partial<CreateCatalogRequest>,
  ): Promise<CatalogDTO> {
    const updated = await this.catalogService.update(id, updateCatalogRequest);
    if (!updated) {
      throw new NotFoundException(`Catalog ${id} not found`);
    }
    return toCatalogDTO(updated);
  }

  @Delete('/items/:id')
  async remove(@Param('id') id: string): Promise<CatalogDTO> {
    const removed = await this.catalogService.remove(id);
    if (!removed) {
      throw new NotFoundException(`Catalog ${id} not found`);
    }
    return toCatalogDTO(removed);
  }

  @Patch('/audit')
  async updateAudit(
    @Body('version') version: number,
    @Headers('x-mat-flip-request') secureHeader?: string,
  ): Promise<CatalogAuditDocument> {
    if (secureHeader !== process.env.MAT_FLIP_X_HEADER) {
      throw new UnauthorizedException('YOU SHOULD NOT BE HERE >:(');
    }
    if (version === undefined || version === null) {
      throw new BadRequestException('Version number is required to update audit');
    }
    return this.catalogService.updateAudit(version);
  }

  @Get('/audit')
  async getAudit(
    @Headers('x-mat-flip-request') secureHeader?: string,
  ): Promise<CatalogAuditDocument> {
    if (secureHeader !== process.env.MAT_FLIP_X_HEADER) {
      throw new UnauthorizedException('YOU SHOULD NOT BE HERE >:(');
    }
    const audit = await this.catalogService.getAudit();
    if (!audit) {
      throw new NotFoundException('Catalog audit not found');
    }
    return audit;
  }

  @Get('/audit/version')
  async getAuditVersion(
    @Req() req: Request, @Headers('x-mat-flip-request') secureHeader?: string
  ): Promise<{ version: number }> {
    const token = (req as any).cookies?.['mf_session'];
    let authorized = false;

    // attempt authorization via secure header first
    if (secureHeader == process.env.MAT_FLIP_X_HEADER) {
      authorized = true;
    }

    // check session cookie if not yet authorized
    if (!authorized && token) {
      const claims = this.authService.verifySession(token);
      // Session `sub` contains the Google ID (from auth.controller)
      const googleId = claims.sub as string | undefined;
      if (googleId) {
          authorized = true;
      }
    }

    if (!authorized) {
      throw new UnauthorizedException('This is not the catalog you are looking for... is it?');
    }

    const audit = await this.catalogService.getAudit();
    const auditVersion = audit?.toJSON().version;
    return { version: auditVersion ?? 0 };
  }
}
