# verdaccio-dynamodb

> DynamoDB Auth

---

##### Note: Currently a WIP but should provide basic functionality


### Prerequisites
1. Existing DynamoDB table with a primary partition key of "username" (string)
2. Existing "users" in the table with the structure below

```json
{
  "groups": { "L": [{ "S": "admin" } ] },
  "password": { "S": "$2a$10$FZF3...soYgLgS26HWvga" },
  "username": { "S": "alice" }
}
```

### Verdaccio Config

```yaml
plugins: /verdaccio/plugins

auth:
  dynamodb:
    table: my-verdaccio-users // optional, defaults to 'verdaccio-users'
    region: us-west-1 // optional, defaults to 'us-east-1'
    accessKeyId: AKAIAKFWIFUALDFUWY // optional, can be an env variable or assumed from a role
    secretAccessKey: 19kweihal3e0r82ls83rh // optional, can be an env variable or assumed from a role

uplinks:
  npmjs:
    url: https://registry.npmjs.org/

store:
  memory:
    limit: 1000

middlewares:
  audit:
    enabled: true

packages:
  '@*/*':
    access: $all
    publish: $authenticated
    proxy: npmjs

  '**':
    access: $all
    publish: $authenticated
    proxy: npmjs

logs:
  - {type: stdout, format: pretty, level: trace}
```

### Generating passwords

A binary is provided to create passwords for the database.  To generate a hash for the password 
"testing"

`./node_modules/.bin/gen-pass testing`

### Adding users

Currently adding users is not supported.  Verdaccio's support for adding users seems to be in 
flux currently.  Once that is more stable, I will update the package to support it.  For now,
you are responsible for adding users to the DynamoDB table.
