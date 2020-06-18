import { DynamoClient } from '../src/DynamoClient';
import { config } from './__mocks__/config';

const AWS = require('aws-sdk');

const dynamoClient = new DynamoClient({
  tableName: 'verdaccio-users',
  region: 'us-east-1',
  ...config,
});

const mockDescribeTablePromise = jest.fn();
const mockFetchUserPromise = jest.fn();
const mockInsertUserPromise = jest.fn();
const mockCreateTablePromise = jest.fn();

jest.mock('aws-sdk', () => ({
  DynamoDB: jest.fn().mockImplementation(() => ({
    describeTable: jest.fn().mockImplementation(() => ({
      promise: mockDescribeTablePromise,
    })),
    query: jest.fn().mockImplementation(() => ({
      promise: mockFetchUserPromise,
    })),
    putItem: jest.fn().mockImplementation(() => ({
      promise: mockInsertUserPromise,
    })),
    createTable: jest.fn().mockImplementation(() => ({
      promise: mockCreateTablePromise,
    })),
  })),
}));

describe('DB Client', () => {
  beforeEach(() => {
    mockDescribeTablePromise.mockClear();
    mockFetchUserPromise.mockClear();
    mockInsertUserPromise.mockClear();
    mockCreateTablePromise.mockClear();
  });

  test('should verify the table exists', async () => {
    mockDescribeTablePromise.mockImplementation(() =>
      Promise.resolve({ Table: 'verdaccio-users' })
    );

    const tableExists = await dynamoClient.tableExists();
    expect(tableExists).toBe(true);
  });

  test('should return table name if table do not exist', async () => {
    mockDescribeTablePromise.mockImplementation(() => Promise.resolve({}));
    mockCreateTablePromise.mockImplementation(() =>
      Promise.resolve({ TableDescription: { TableName: 'verdaccio-users' } })
    );

    const data = await dynamoClient.createTable();
    expect(data).toBe(dynamoClient.tableName);
  });

  test('should crete table if table exists', async () => {
    mockDescribeTablePromise.mockImplementation(() =>
      Promise.resolve({ Table: 'not-verdaccio-users' })
    );

    const data = await dynamoClient.createTable();
    expect(data).toBe(dynamoClient.tableName);
  });

  test('should find known user without groups', async () => {
    const mockUser = {
      username: { S: 'Test User' },
      password: { S: 'password' },
      groups: { L: [] },
    };

    mockFetchUserPromise.mockImplementation(() =>
      Promise.resolve({ Items: [mockUser] })
    );

    const username = 'Test User';
    const user = await dynamoClient.fetchUser(username);
    expect(user.username).toBe(mockUser.username.S);
  });

  test('should find known user with groups', async () => {
    const mockUser = {
      username: { S: 'Test User' },
      password: { S: 'password' },
      groups: { L: ['admin'] },
    };

    mockFetchUserPromise.mockImplementation(() =>
      Promise.resolve({ Items: [mockUser] })
    );

    const username = 'Test User';
    const user = await dynamoClient.fetchUser(username);
    expect(user.username).toBe(mockUser.username.S);
  });

  test('should insert a user', async () => {
    mockInsertUserPromise.mockImplementation(() =>
      Promise.resolve({
        ConsumedCapacity: { TableName: 'verdaccio-users', CapacityUnits: 1 },
      })
    );

    const user = {
      username: 'test-user',
      password: 'testpassword',
      groups: ['admin'],
    };

    const result = await dynamoClient.putUser(user);
    expect(result).toBeTruthy();
  });

  test('should throw error on unknown user', async () => {
    mockFetchUserPromise.mockImplementation(() =>
      Promise.resolve({ Items: [] })
    );

    const username = 'unkonwn.user';
    let error;

    try {
      const user = await dynamoClient.fetchUser(username);
    } catch (notFoundMessage) {
      error = notFoundMessage;
    }

    expect(error).toBe(dynamoClient.notFoundMessage);
  });
});
