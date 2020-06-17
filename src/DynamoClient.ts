import AWS from 'aws-sdk';
import bcrypt from 'bcrypt';
import { AuthUser, DynamoDBConfig } from '../types';

export class DynamoClient {
  public tableName = 'verdaccio-users';
  public notFoundMessage = 'User not found';

  private dynamodb: AWS.DynamoDB;

  constructor(config: DynamoDBConfig) {
    const { region, accessKeyId, secretAccessKey, sessionToken } = config;
    this.tableName = config.tableName;

    this.dynamodb = new AWS.DynamoDB({
      region,
      accessKeyId,
      secretAccessKey,
      sessionToken,
    });
  }

  public async tableExists(): Promise<boolean> {
    return this.dynamodb
      .describeTable({ TableName: this.tableName })
      .promise()
      .then((data) => {
        return data.Table !== undefined;
      });
  }

  public async createTableIfNeeded(): Promise<string | undefined> {
    const tableExists = await this.tableExists();
    if (tableExists) {
      return Promise.resolve(this.tableName);
    }

    const schema = {
      AttributeDefinitions: [{ AttributeName: 'username', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'username', KeyType: 'HASH' }],
      TableName: this.tableName,
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };

    return this.dynamodb
      .createTable(schema)
      .promise()
      .then((data) => {
        return data?.TableDescription?.TableName;
      });
  }

  public async putUser(user: AuthUser): Promise<boolean> {
    const saltRounds = 10;

    const userItem: AWS.DynamoDB.PutItemInput = {
      Item: {
        username: { S: user.username },
        password: { S: bcrypt.hashSync(user.password, saltRounds) },
        groups: { L: user.groups.map((group) => ({ S: group })) },
      },
      ReturnConsumedCapacity: 'TOTAL',
      TableName: this.tableName,
    };

    return this.dynamodb
      .putItem(userItem)
      .promise()
      .then((data) => {
        return data?.ConsumedCapacity?.CapacityUnits === 1;
      });
  }

  public async fetchUser(username): Promise<AuthUser> {
    const params = {
      ExpressionAttributeValues: { ':v1': { S: username } },
      KeyConditionExpression: 'username = :v1',
      TableName: this.tableName,
    };

    return this.dynamodb
      .query(params)
      .promise()
      .then((data) => {
        if (data?.Items?.length !== 1) {
          return Promise.reject(this.notFoundMessage);
        }

        const authUser: AuthUser = {
          username: data.Items[0].username.S!,
          password: data.Items[0].password.S!,
          groups: data.Items[0].groups.L?.map((group) => group.S!)!,
        };

        return authUser;
      });
  }
}
