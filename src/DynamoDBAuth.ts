import {
  PluginOptions,
  AuthAccessCallback,
  AuthCallback,
  Callback,
  PackageAccess,
  IPluginAuth,
  RemoteUser,
  Logger,
} from '@verdaccio/types';

import { DynamoDBConfig, AuthUser } from '../types';
import { DynamoClient } from './DynamoClient';
import bcrypt from 'bcrypt';

/**
 * Custom Verdaccio Authenticate Plugin.
 */
export default class DynamoDBAuth implements IPluginAuth<DynamoDBConfig> {
  public logger: Logger;
  private dynamoClient: DynamoClient;

  public constructor(
    config: DynamoDBConfig,
    options: PluginOptions<DynamoDBConfig>
  ) {
    this.logger = options.logger;

    const defaults = {
      tableName: 'verdaccio-users',
      region: 'us-east-1',
    };

    this.dynamoClient = new DynamoClient({ ...defaults, ...config });
    return this;
  }
  /**
   * Authenticate an user.
   * @param username username to log
   * @param password provided password
   * @param cb callback function
   */
  public authenticate(
    username: string,
    password: string,
    cb: AuthCallback
  ): void {
    const validateUser = (fetchedUser) => {
      const validPassword = bcrypt.compareSync(password, fetchedUser.password);
      return validPassword ? cb(null, fetchedUser.groups) : cb(null, false);
    };

    this.dynamoClient
      .fetchUser(username)
      .then(validateUser)
      .catch(() => cb(null, false));
  }

  public adduser(username: string, password: string, cb: AuthCallback): void {
    return this.authenticate(username, password, cb);
  }

  /**
   * Triggered on each access request
   * @param user
   * @param pkg
   * @param cb
   */
  public allow_access(
    user: RemoteUser,
    pkg: PackageAccess,
    cb: AuthAccessCallback
  ): void {
    cb(null, true);
  }

  /**
   * Triggered on each publish request
   * @param user
   * @param pkg
   * @param cb
   */
  public allow_publish(
    user: RemoteUser,
    pkg: PackageAccess,
    cb: AuthAccessCallback
  ): void {
    if (!pkg.publish || pkg.publish.some((g) => user.groups.includes(g))) {
      this.logger.debug({ name: user.name }, '@{name} can publish');
      cb(null, true);
      return;
    }

    this.logger.error({ name: user.name }, '@{name} can not publish');
    cb(null, false);
  }

  public allow_unpublish(
    user: RemoteUser,
    pkg: PackageAccess,
    cb: AuthAccessCallback
  ): void {
    return this.allow_publish(user, pkg, cb);
  }
}
