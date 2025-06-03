/**
 * テスト用の共通設定とヘルパー関数
 */

// グローバルなcrypto.randomUUIDのモック
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

export {};