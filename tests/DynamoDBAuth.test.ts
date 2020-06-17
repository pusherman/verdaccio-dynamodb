import bcrypt from 'bcrypt';

import { logger } from './__mocks__/logger';
import { config } from './__mocks__/config';

import DynamoDBAuth from '../src/index';
import { DynamoDBConfig } from '../types/index';

const remoteUserKnown = {
  real_groups: ['$authenticated'],
  groups: ['$authenticated'],
  name: 'known-user',
};

const remoteUserUnknown = {
  real_groups: ['$anonymous'],
  groups: ['$anonymous'],
  name: 'unknown-user',
};

const nullPackageAccess = {};

const authorizedPackageAccess = {
  publish: ['$authenticated'],
  access: ['$authenticated'],
};

const mockFetchUser = jest.fn();

jest.mock('../src/DynamoClient', () => ({
  DynamoClient: jest.fn().mockImplementation(() => ({
    fetchUser: mockFetchUser,
  })),
}));

describe('constructor()', () => {
  let auth;

  beforeEach(() => {
    const options = { logger, config };
    auth = new DynamoDBAuth(config, options);
    mockFetchUser.mockClear();
  });

  test('All users should be allowed access', () => {
    const callback = (error, access) => {
      expect(access).toBeTruthy();
    };

    auth.allow_access(remoteUserUnknown, nullPackageAccess, callback);
  });

  test('Pushing packages is allowed by speciic specified', () => {
    const callback = (error, access) => {
      expect(access).toBeTruthy();
    };

    auth.allow_publish(remoteUserUnknown, nullPackageAccess, callback);
  });

  test('Pushing packages is allowed by groups if specified', () => {
    const callback = (error, access) => {
      expect(access).toBeTruthy();
    };

    auth.allow_publish(remoteUserKnown, authorizedPackageAccess, callback);
  });

  test('Pushing packages is not allowed if user not in allowed group', () => {
    const callback = (error, access) => {
      expect(access).toBeFalsy();
    };

    auth.allow_publish(remoteUserUnknown, authorizedPackageAccess, callback);
  });

  test('Allow unpublish if can publish', () => {
    const callback = (error, access) => {
      expect(access).toBeTruthy();
    };

    auth.allow_unpublish(remoteUserKnown, authorizedPackageAccess, callback);
  });

  test('Should authenticate with correct credentials', () => {
    const callback = (error, groups) => {
      expect(groups).toContain('admin');
    };

    const password = 'test-password';
    const passwordHash = bcrypt.hashSync(password, 10);

    mockFetchUser.mockImplementation(() => {
      return Promise.resolve({ password: passwordHash, groups: ['admin'] });
    });

    auth.authenticate('user', password, callback);
  });

  test('Should fail auth with incorrect password', () => {
    const callback = (error, access) => {
      expect(access).toBeFalsy();
    };

    const password = 'test-password';
    const passwordHash = bcrypt.hashSync('another-password', 10);

    mockFetchUser.mockImplementation(() => {
      return Promise.resolve({ password: passwordHash });
    });

    auth.authenticate('user', password, callback);
  });

  test('Should return an error if the fetch user promise was rejected', () => {
    const mockError = 'Unknown Error';

    const callback = (error, access) => {
      // the authenticate callback always passes
      // null when there is an error
      expect(error).toBe(null);
    };

    mockFetchUser.mockImplementation(() => {
      return Promise.reject(mockError);
    });

    auth.authenticate('user', 'test-password', callback);
  });

  test('Add user should authenticate if user exists', () => {
    const callback = (error, groups) => {
      expect(groups).toContain('admin');
    };

    const password = 'test-password';
    const passwordHash = bcrypt.hashSync(password, 10);

    mockFetchUser.mockImplementation(() => {
      return Promise.resolve({ password: passwordHash, groups: ['admin'] });
    });

    auth.adduser('user', password, callback);
  });
});
