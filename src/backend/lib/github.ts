/**
 * Provides convenience functions for interfacing with
 * GitHub's REST API as a GitHub application.
 *
 * @module
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import log from 'electron-log';
import { is } from '@liga/shared';

/** @interface */
export interface Asset {
  url: string;
  id: number;
  name: string;
  download_count: number;
  size: number;
  created_at: string;
  browser_download_url: string;
}

/** @interface */
interface Cache {
  installId: number;
  jwt: string;
  token: string;
  tokenExpiry: Date;
}

/** @interface */
interface JwtPayload {
  iss: string;
  iat: number;
  exp: number;
}

/** @interface */
export interface ReleaseResponse {
  html_url: string;
  id: number;
  name: string;
  prerelease: boolean;
  published_at: string;
  tag_name: string;
  tarball_url: string;
  assets: Asset[];
  body: string;
}

/** @interface */
interface TokenResponse {
  token: string;
  expires_at: string;
}

/**
 * Contains the cached application identifier
 * and authentication tokens.
 *
 * @constant
 */
const cache: Cache = {
  installId: null,
  jwt: null,
  token: null,
  tokenExpiry: null,
};

/**
 * Generic GitHub REST API request handler.
 *
 * @param endpoint  The endpoint to call.
 * @param opts      The fetch options.
 * @function
 */
export async function request<T = unknown>(endpoint: string, opts: Partial<RequestInit>) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...opts.headers,
    },
    ...opts,
  });
  return response.json() as T;
}

/**
 * Interfaces with the GitHub REST API
 * as a GitHub Application.
 *
 * @class
 */
export class Application {
  /**
   * The client id.
   *
   * @constant
   */
  private clientId: string;

  /**
   * Scoped electron-log instance.
   *
   * @constant
   */
  public log: log.LogFunctions;

  /**
   * The extrapolated repository information.
   *
   * @constant
   */
  private repository = {
    domain: '',
    name: '',
    owner: '',
    protocol: '',
  };

  /**
   * Constructor.
   *
   * @param clientId  The application client id.
   * @param repo      The repository.
   * @constructor
   */
  constructor(clientId: string, repo: string) {
    // set up plain properties
    this.clientId = clientId;
    this.log = log.scope('github');

    // extrapolate repository info
    const repoInfo = repo.match(
      /(?<protocol>.+):\/\/(?<domain>.+)\/(?<owner>\w+)\/(?<name>.+)\.git/,
    );
    this.repository.domain = repoInfo.groups.domain;
    this.repository.name = repoInfo.groups.name;
    this.repository.owner = repoInfo.groups.owner;
    this.repository.protocol = repoInfo.groups.protocol;
  }

  /**
   * Gets the GitHub API base URL.
   *
   * @function
   */
  private get apiBaseUrl() {
    return `${this.repository.protocol}://api.${this.repository.domain}`;
  }

  /**
   * Gets the path to the private cert key file.
   *
   * @function
   */
  private get certPath() {
    const pemFilename = 'certs/issues-github.pem';

    if (process.env['NODE_ENV'] === 'cli') {
      return path.join(__dirname, '../../../src/resources', pemFilename);
    }

    return is.dev()
      ? path.join(__dirname, '../../src/resources', pemFilename)
      : path.join(process.resourcesPath, pemFilename);
  }

  /**
   * Gets the app's installation id.
   *
   * @function
   */
  private async getInstallId() {
    if (cache.installId) {
      this.log.debug('Using cached installation id...');
      return Promise.resolve(cache.installId);
    }

    const endpoint = `${this.apiBaseUrl}/repos/${this.repository.owner}/${this.repository.name}/installation`;
    const data = await request<{ id: number }>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await this.getJwt()}`,
      },
    });
    cache.installId = data.id;
    return Promise.resolve(cache.installId);
  }

  /**
   * Gets the JSON web token.
   *
   * @function
   */
  private async getJwt() {
    if (this.validateJwt()) {
      this.log.debug('Using cached JWT...');
      return Promise.resolve(cache.jwt);
    }

    // @todo: better time options
    const signingKey = await fs.promises.readFile(this.certPath, 'utf8');
    const header = Buffer.from(
      JSON.stringify({
        typ: 'JWT',
        alg: 'RS256',
      }),
    ).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({
        iat: Math.round(Date.now() / 1000),
        exp: Math.round(Date.now() / 1000) + 300,
        iss: this.clientId,
      }),
    ).toString('base64');

    // sign the payload
    const signer = crypto.createSign('RSA-SHA256');
    signer.write(`${header}.${payload}`);
    signer.end();

    // return the signed jwt
    cache.jwt = `${header}.${payload}.${signer.sign(signingKey, 'base64')}`;
    return Promise.resolve(cache.jwt);
  }

  /**
   * Gets the token.
   *
   * @function
   */
  private async getToken() {
    if (this.validateToken()) {
      this.log.debug('Using cached token...');
      return Promise.resolve(cache.token);
    }

    const endpoint = `${this.apiBaseUrl}/app/installations/${await this.getInstallId()}/access_tokens`;
    const data = await request<TokenResponse>(endpoint, {
      headers: {
        Authorization: `Bearer ${await this.getJwt()}`,
      },
    });

    if (!data || !data?.expires_at || !data?.token) {
      throw new Error(`could not generate token: ${JSON.stringify(data)}`);
    }

    this.log.debug('Token created. Expires: %s', data.expires_at);
    cache.token = data.token;
    cache.tokenExpiry = new Date(data.expires_at);
    return Promise.resolve(cache.token);
  }

  /**
   * Validates a JSON web token by ensuring
   * it has not expired yet.
   *
   * @function
   */
  private validateJwt() {
    if (!cache.jwt) {
      return false;
    }

    const [, payload] = cache.jwt.split('.');
    const data = JSON.parse(Buffer.from(payload, 'base64').toString()) as JwtPayload;
    return Math.round(Date.now() / 1000) < data.exp;
  }

  /**
   * Validates an installation token by
   * ensuring it has not expired yet.
   *
   * @function
   */
  private validateToken() {
    if (!cache.token) {
      return false;
    }

    return new Date() < cache.tokenExpiry;
  }

  /**
   * Creates an issue.
   *
   * @param data The issue data.
   * @function
   */
  public async createIssue(data: unknown) {
    const endpoint = `${this.apiBaseUrl}/repos/${this.repository.owner}/${this.repository.name}/issues`;
    return request<GitHubIssueResponse>(endpoint, {
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Creates an issue comment.
   *
   * @param id    The issue id.
   * @param data  The comment data.
   */
  public async createIssueComment(id: number, data: unknown) {
    const endpoint = `${this.apiBaseUrl}/repos/${this.repository.owner}/${this.repository.name}/issues/${id}/comments`;
    return request<GitHubCommentResponse>(endpoint, {
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Gets an issue.
   *
   * @param id The issue id.
   * @function
   */
  public async getIssue(id: number) {
    const endpoint = new URL(
      `${this.apiBaseUrl}/repos/${this.repository.owner}/${this.repository.name}/issues/${id}`,
    );
    return request<GitHubIssueResponse>(endpoint.href, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
      },
    });
  }

  /**
   * Gets an issue's comment thread.
   *
   * @param id The issue id.
   * @function
   */
  public async getIssueComments(id: number) {
    const endpoint = new URL(
      `${this.apiBaseUrl}/repos/${this.repository.owner}/${this.repository.name}/issues/${id}/comments`,
    );
    return request<Array<GitHubCommentResponse>>(endpoint.href, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
      },
    });
  }

  /**
   * Gets the issues listed in the array of ids.
   *
   * @param ids The list of issue id.
   * @function
   */
  public async getIssuesByIds(ids: Array<number>) {
    // build url
    const endpoint = new URL(
      `${this.apiBaseUrl}/repos/${this.repository.owner}/${this.repository.name}/issues`,
    );
    endpoint.searchParams.append('per_page', '100');
    endpoint.searchParams.append('state', 'all');

    // send request and apply filter
    const issues = await request<Array<GitHubIssueResponse>>(endpoint.href, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
      },
    });
    return issues.filter((issue) => ids.includes(issue.number));
  }

  /**
   * Gets all releases.
   *
   * @function
   */
  public async getAllReleases() {
    const endpoint = new URL(
      `${this.apiBaseUrl}/repos/${this.repository.owner}/${this.repository.name}/releases`,
    );
    return request<Array<ReleaseResponse>>(endpoint.href, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
      },
    });
  }
}
