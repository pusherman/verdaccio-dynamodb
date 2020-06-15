import { Config } from '@verdaccio/types';

export interface DynamoDBConfig extends Config {
  table: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface AuthUser {
  username: string;
  password: string;
  groups: string[];
}
