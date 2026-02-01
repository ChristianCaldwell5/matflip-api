import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class MongoService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async startSession(): Promise<ClientSession> {
    return this.connection.startSession();
  }

  async withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await this.startSession();
    try {
      let result: T | undefined;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      if (result === undefined) {
        throw new Error('Transaction function did not return a result');
      }
      return result;
    } finally {
      await session.endSession();
    }
  }

  async ping(): Promise<boolean> {
    try {
      const db = this.connection.db;
      if (!db) return false;
      await db.admin().command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }
}
