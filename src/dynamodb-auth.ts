#!/usr/bin/env node

import * as yargs from 'yargs';
import bcrypt from 'bcrypt';
import { DynamoClient } from './DynamoClient';

interface Arguments {
  [x: string]: unknown;
  _: string[];
  region?: string;
  table?: string;
  groups?: string[];
}

const argv: Arguments = yargs.options({
  region: { type: 'string', default: 'us-east-1' },
  table: { type: 'string', default: 'verdaccio-users' },
  groups: { type: 'array', default: ['users'] },
}).argv;

const tableName = argv.table;
const region = argv.region;
const client = new DynamoClient({ tableName, region });

switch (argv._[0]) {
  case 'create-hash':
    console.dir(createHash(argv._[1]));
    break;

  case 'create-table':
    createTable();
    break;

  case 'add-user':
    addUser(argv._[1], argv._[2], argv.groups);
}

function createHash(password) {
  const saltRounds = 10;
  return bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds));
}

function createTable() {
  client
    .createTable()
    .then(() => console.dir(`Successfully created table: ${tableName}`))
    .catch((error) => console.dir(error));
}

function addUser(username, password, groups) {
  client
    .putUser({ username, password, groups })
    .then(() => console.dir(`Successfully created user: ${username}`))
    .catch((error) => console.dir(error));
}
