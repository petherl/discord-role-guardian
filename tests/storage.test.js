// Storage module tests - ensures data persistence works correctly
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const testDataDir = './test-data';
process.env.DATA_PATH = testDataDir;

describe('Storage Module', () => {
  let storage;
  const testConfigFile = path.join(testDataDir, 'config.json');

  beforeAll(async () => {
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    storage = await import('../src/data/storage.js');
  });

  afterAll(() => {
    // Clean up test data directory
    if (fs.existsSync(testConfigFile)) {
      fs.unlinkSync(testConfigFile);
    }
    if (fs.existsSync(testDataDir)) {
      fs.rmdirSync(testDataDir);
    }
  });

  beforeEach(() => {
    // Clear config file before each test
    if (fs.existsSync(testConfigFile)) {
      fs.unlinkSync(testConfigFile);
    }
  });

  test('should save and retrieve welcome message', () => {
    const guildId = '123456789';
    const config = {
      channelId: '987654321',
      message: 'Welcome {user}!',
      embedColor: '#5865F2'
    };

    storage.saveWelcomeConfig(guildId, config);
    const retrieved = storage.getWelcomeConfig(guildId);

    expect(retrieved).toEqual(config);
  });

  test('should remove welcome message', () => {
    const guildId = '123456789';
    const config = {
      channelId: '987654321',
      message: 'Welcome!'
    };

    storage.saveWelcomeConfig(guildId, config);
    const removed = storage.removeWelcomeConfig(guildId);
    const retrieved = storage.getWelcomeConfig(guildId);

    expect(removed).toBe(true);
    expect(retrieved).toBeNull();
  });

  test('should handle multiple guilds independently', () => {
    const guild1 = '111111111';
    const guild2 = '222222222';

    storage.saveWelcomeConfig(guild1, {
      channelId: '111',
      message: 'Welcome to Guild 1'
    });
    storage.saveWelcomeConfig(guild2, {
      channelId: '222',
      message: 'Welcome to Guild 2'
    });

    expect(storage.getWelcomeConfig(guild1).message).toBe('Welcome to Guild 1');
    expect(storage.getWelcomeConfig(guild2).message).toBe('Welcome to Guild 2');
  });

  test('should persist data to file', () => {
    const guildId = '123456789';
    const config = {
      channelId: '987654321',
      message: 'Test persistence'
    };

    // Save config
    storage.saveWelcomeConfig(guildId, config);

    // Verify it was saved and can be retrieved
    const retrieved = storage.getWelcomeConfig(guildId);
    expect(retrieved).toEqual(config);
    expect(retrieved.message).toBe('Test persistence');
  });

  test('should handle reaction role configuration', () => {
    const messageId = '999888777';
    const config = [
      {
        emoji: '✅',
        roleId: '111222333',
        guildId: '123456789',
        channelId: '987654321'
      }
    ];

    storage.saveReactionRoleConfig(messageId, config);
    const retrieved = storage.getReactionRoleConfig(messageId);

    expect(retrieved).toEqual(config);
  });

  test('should handle leveling system data', () => {
    const guildId = '123456789';
    const userId = '987654321';

    const initial = storage.getUserLevel(guildId, userId);
    expect(initial).toEqual({ xp: 0, level: 0 });

    storage.addUserXP(guildId, userId, 50);
    const updated = storage.getUserLevel(guildId, userId);

    expect(updated.xp).toBe(50);
  });

  test('should handle scheduled messages', () => {
    const guildId = '123456789';
    const message = {
      id: 'msg-001',
      name: 'Test Message',
      channelId: '987654321',
      message: 'Hello World',
      schedule: { type: 'daily', time: '12:00' }
    };

    storage.saveScheduledMessage(guildId, message);
    const retrieved = storage.getGuildScheduledMessages(guildId);

    expect(retrieved).toHaveLength(1);
    expect(retrieved[0]).toEqual(message);
  });
});
