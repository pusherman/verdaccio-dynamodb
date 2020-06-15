import { DynamoClient } from '../src/DynamoClient';

const dynamoClient = new DynamoClient({
  tableName: 'verdaccio-users',
  region: 'us-east-1',
});

describe('DB Client', () => {

  test('should verify the table exists', async () => {
    const tableExists = await dynamoClient.tableExists();
    expect(tableExists).toBe(true);
  })

  test('should create table', async () => {
    const data = await dynamoClient.createTableIfNeeded();
    expect(data).toBe(dynamoClient.tableName);
  });

  test('should find known user', async () => {
    const username = 'corey.wilson@verisk.com';
    const user = await dynamoClient.fetchUser(username);
    expect(user.username).toBe(username);
  });

  test('should insert a user', async () => {
    const user = {
      username: 'corey.wilson@verisk.com',
      password: '$2b$10$lWKE0prUgs21W3GVqu3Yp.eEHhDSIHqgEBEZ5Fp1A4Sj34EM9q0z.',
      groups: ['admin'],
    };

    const result = await dynamoClient.putUser(user);
    expect(result).toBeTruthy();
  });

  test('should throw error on unknown user', async () => {
    const username = 'unkonwn.user@verisk.com';
    let error;

    try {
      const user = await dynamoClient.fetchUser(username);
    } catch(notFoundMessage) {
      error = notFoundMessage;
    }

    expect(error).toBe(dynamoClient.notFoundMessage);
  });
});
