import { UserDTO } from './dto/user.dto';

describe('UserDTO', () => {
  it('maps from plain user object', () => {
    const plain: any = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      name: 'Tester',
      avatarUrl: 'https://example.com/a.png',
      googleId: 'google-123',
      displayName: 'TestDisplay',
      stats: { gamesPlayed: 5 },
      levelInfo: { level: 2 },
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      __v: 10,
    };
    const dto = UserDTO.fromUser(plain as any);
    expect(dto).toMatchObject({
      id: plain._id,
      email: plain.email,
      name: plain.name,
      avatarUrl: plain.avatarUrl,
      googleId: plain.googleId,
      displayName: plain.displayName,
      stats: plain.stats,
      levelInfo: plain.levelInfo,
    });
    // ensure mongoose internals not copied
  expect((dto as any).__v).toBeUndefined();
  });
});