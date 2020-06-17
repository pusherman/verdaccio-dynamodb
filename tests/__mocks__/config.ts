export const config = {
  storage: './test-storage',
  auth: {
    htpasswd: {
      file: './htpasswd',
      max_users: 1000,
    },
  },
  uplinks: {
    npmjs: {
      url: 'https://registry.npmjs.org',
      cache: true,
    },
  },
  packages: {
    '@*/*': {
      access: ['$all'],
      publish: ['$authenticated'],
      proxy: [],
    },
    '*': {
      access: ['$all'],
      publish: ['$authenticated'],
      proxy: ['npmjs'],
    },
    '**': {
      access: [],
      publish: [],
      proxy: [],
    },
  },
  self_path: './src/___tests___/__fixtures__/config.yaml',
  https: {
    key: 'mock-key',
  },
  user_agent: 'verdaccio/3.0.0-alpha.7',
  users: {},
  server_id: 'severMockId',
  secret: 'someSecret',
  security: {
    web: {
      sign: {},
      verify: {},
    },
    api: {
      legacy: false,
    },
  },
  getMatchedPackagesSpec: (storage) => {},
  checkSecretKey: (secret): string => {
    if (!secret) {
      const newSecret = 'superNewSecret';

      return newSecret;
    }
    return secret;
  },
};
