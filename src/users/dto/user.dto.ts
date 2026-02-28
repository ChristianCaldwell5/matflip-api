import { User, UserDocument } from '../schemas/user.schema';
import { PlayerStats } from '../schemas/player-stats.schema';
import { LevelInfo } from '../schemas/level-info.schema';
import { CurrentCustomizationSelects } from '../schemas/current-customization-selects.schema';
import { CatalogItem } from 'src/catalog/schemas/catalog.schema';

// Data Transfer Object for outbound user responses
export class UserDTO {
  id: string; // normalized id
  email: string;
  name?: string;
  avatarUrl?: string;
  googleId?: string;
  displayName?: string;
  stats?: PlayerStats;
  levelInfo?: LevelInfo;
  currentCustomizationSelects?: CurrentCustomizationSelects;
  ownedCatalogItems?: CatalogItem[];
  flipBucks?: number;
  createdAt?: Date;
  updatedAt?: Date;

  private constructor(init: Partial<UserDTO>) {
    Object.assign(this, init);
  }

  // Factory that safely converts a mongoose document or plain object into DTO
  static fromUser(user: UserDocument | User | (User & { _id?: any; createdAt?: any; updatedAt?: any })) : UserDTO {
    if (!user) {
      throw new Error('Cannot map empty user to UserDTO');
    }
    // If it's a mongoose document prefer toObject for lean copy
    const raw: any = (user as any).toObject ? (user as any).toObject() : user;
    return new UserDTO({
      id: raw._id ? String(raw._id) : undefined,
      email: raw.email,
      name: raw.name,
      avatarUrl: raw.avatarUrl,
      // TODO: TAKE GOOGLE ID OUT?
      googleId: raw.googleId,
      displayName: raw.displayName,
      stats: raw.stats,
      levelInfo: raw.levelInfo,
      currentCustomizationSelects: raw.currentCustomizationSelects,
      ownedCatalogItems: raw.ownedCatalogItems,
      flipBucks: raw.flipBucks,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined,
    });
  }
}

export function toUserDTO(user: UserDocument | User): UserDTO {
  return UserDTO.fromUser(user);
}
