import {
  PluginOptions,
  AuthAccessCallback,
  AuthCallback,
  PackageAccess,
  IPluginAuth,
  RemoteUser,
  Logger,
} from '@verdaccio/types';

import { DynamoDBConfig } from '../types';
import { DynamoClient } from './DynamoClient';
import bcrypt from 'bcrypt';

/**
 * Custom Verdaccio Authenticate Plugin.
 */
export default class DynamoDBAuth implements IPluginAuth<DynamoDBConfig> {
  public logger: Logger;
  private dynamoClient: DynamoClient;

  public constructor(config: DynamoDBConfig, options: PluginOptions<DynamoDBConfig>) {
    this.logger = options.logger;

    const defaults = {
      table: 'verdaccio-users',
      region: 'us-east-1',
    };

    this.dynamoClient = new DynamoClient({...defaults, ...config});
    return this;
  }
  /**
   * Authenticate an user.
   * @param user user to log
   * @param password provided password
   * @param cb callback function
   */
  public authenticate(user: string, password: string, cb: AuthCallback): void {
    this.dynamoClient.fetchUser(user).then(user => {
      this.logger.info('got the user');
      if (bcrypt.compareSync(password, user.password)) {
        cb(null, user.groups)
      } else {
        cb('Invalid password', false);
      }
    }).catch(error => {
      this.logger.error(error);
      cb(error, false);
    });
  }


  public adduser(user: string, password: string, cb: AuthCallback): void {
    return this.authenticate(user, password, cb);
  }

  /**
   * Triggered on each access request
   * @param user
   * @param pkg
   * @param cb
   */
  public allow_access(user: RemoteUser, pkg: PackageAccess, cb: AuthAccessCallback): void {
    cb(null, true);
  }

  /**
   * Triggered on each publish request
   * @param user
   * @param pkg
   * @param cb
   */
  public allow_publish(user: RemoteUser, pkg: PackageAccess, cb: AuthAccessCallback): void {
    if (!pkg.publish || pkg.publish.some(g=> user.groups.includes(g))) {
      this.logger.debug({name: user.name}, '@{name} has been granted to publish');
      cb(null, true);
    }

    this.logger.error({name: user.name}, '@{name} is not allowed to publish this package');
    cb(null, false);
  }

  public allow_unpublish(user: RemoteUser, pkg: PackageAccess, cb: AuthAccessCallback): void {
    return this.allow_publish(user, pkg, cb);
  }
}
