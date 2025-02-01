/**
 * Provides convenience functions for interfacing with
 * Google's and Firebase's respective REST APIs.
 *
 * @module
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import log from 'electron-log';
import is from 'electron-is';
import { add } from 'date-fns';

/** @interface */
interface Cache {
  jwt: string;
  token: string;
  tokenExpiry: Date;
}

/** @interface */
interface JwtPayload {
  aud: string;
  iat: number;
  iss: string;
  exp: number;
  kid: string;
  scope: string;
}

/** @interface */
interface TokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

/** @interface */
interface UploadResponse {
  name: 'saves.zip';
  bucket: 'liga-esports-manager.appspot.com';
  contentType: 'application/zip';
  timeCreated: '2024-10-10T21:14:30.374Z';
  updated: '2024-10-10T21:14:30.374Z';
  size: '804407';
  downloadTokens: 'ee196783-4566-4829-941c-5d1c348e265e';
}

/**
 * Contains the cached application identifier
 * and authentication tokens.
 *
 * @constant
 */
const cache: Cache = {
  jwt: null,
  token: null,
  tokenExpiry: null,
};

/**
 * Interfaces with Firebase's Cloud Storage APIs.
 *
 * @class
 */
export class Storage {
  /**
   * Service account client email.
   * @constant
   */
  private clientEmail: string;

  /**
   * Service account key id.
   *
   * @constant
   */
  private keyId: string;

  /**
   * Firebase project id.
   *
   * @constant
   */
  private projectId: string;

  /**
   * Scoped electron-log instance.
   *
   * @constant
   */
  public log: log.LogFunctions;

  /**
   * Constructor.
   *
   * @param clientEmail Service account email.
   * @param keyId       Service account key id.
   * @param projectId   Firebase project id.
   */
  constructor(clientEmail: string, keyId: string, projectId: string) {
    this.clientEmail = clientEmail;
    this.keyId = keyId;
    this.projectId = projectId;
    this.log = log.scope('firebase');
  }

  /**
   * Gets the path to the private cert key file.
   *
   * @function
   */
  private get certPath() {
    const pemFilename = 'certs/issues-firebase.pem';

    if (process.env['NODE_ENV'] === 'cli') {
      return path.join(__dirname, '../../../src/resources', pemFilename);
    }

    return is.dev()
      ? path.join(__dirname, '../../src/resources', pemFilename)
      : path.join(process.resourcesPath, pemFilename);
  }

  /**
   * Generates a JSON web token.
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
        aud: 'https://oauth2.googleapis.com/token',
        exp: Math.round(Date.now() / 1000) + 300,
        iat: Math.round(Date.now() / 1000),
        iss: this.clientEmail,
        kid: this.keyId,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
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

    const jwt = await this.getJwt();
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    });
    const data: TokenResponse = await response.json();

    cache.token = data.access_token;
    cache.tokenExpiry = add(new Date(), { seconds: data.expires_in });
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
   * The full URL to the bucket.
   *
   * @function
   */
  public get bucket() {
    return `https://firebasestorage.googleapis.com/v0/b/${this.projectId}.appspot.com/o`;
  }

  /**
   * Builds the download url for the provided reference.
   *
   * @param reference A pointer to a specific file or folder within the bucket
   * @function
   */
  public download(reference: UploadResponse) {
    return `${this.bucket}/${reference.name}?alt=media&token=${reference.downloadTokens}`;
  }

  /**
   * Uploads media to a storage bucket.
   *
   * @param filePath The file to upload.
   * @function
   */
  public async upload(filePath: string) {
    const fileName = path.basename(filePath);
    const fileBuffer = await fs.promises.readFile(filePath);
    const endpoint = `${this.bucket}/${fileName}`;

    // validate that the file extension is supported
    const fileExt = fileName.split('.').pop().toLowerCase();

    switch (fileExt) {
      case 'zip':
        break;
      default:
        throw new Error('File extension not supported: ' + fileExt);
    }

    // upload the file
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.getToken()}`,
        'Content-Type': 'application/zip',
      },
      body: fileBuffer,
    });
    const data: UploadResponse = await response.json();
    return Promise.resolve(data);
  }
}
