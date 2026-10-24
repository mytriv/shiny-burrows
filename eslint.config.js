import tseslint from 'typescript-eslint';
export default tseslint.config(...tseslint.configs.strict, {
  files: ['src/core/**/*.ts'],
  rules: {
    'no-restricted-imports': ['error', { patterns: ['phaser', 'three', 'three/*', 'node:*', '**/app/**', '**/presentation/**'] }],
    'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage', 'performance', 'Date', 'setTimeout', 'requestAnimationFrame', 'self', 'globalThis', 'fetch', 'XMLHttpRequest', 'crypto', 'setInterval', 'WebSocket'],
    'no-restricted-properties': ['error', { object: 'Math', property: 'random' }]
  }
});
