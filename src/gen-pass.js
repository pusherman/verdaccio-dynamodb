#!/usr/bin/env node

const bcrypt = require('bcrypt');
const saltRounds = 10;

bcrypt.genSalt(saltRounds, function (err, salt) {
  bcrypt.hash(process.argv.pop(), salt, function (err, hash) {
    console.log(hash);
  });
});
