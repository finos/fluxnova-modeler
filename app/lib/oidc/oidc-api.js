const http = require('http');

const { Issuer, generators } = require('openid-client');

const {
  ERROR_REASONS,
  DEFAULT_SCOPE,
  LOOPBACK_HOST,
  CALLBACK_PATH,
  LOGIN_TIMEOUT,
  EXPIRY_SKEW
} = require('./constants');

const SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Login successful</title></head>
<body><h2>Login successful</h2><p>You can close this window and return to the modeler.</p></body></html>`;

const FAILURE_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Login failed</title></head>
<body><h2>Login failed</h2><p>You can close this window and try again in the modeler.</p></body></html>`;

/**
 * Provider-neutral OIDC authorization code + PKCE client for the Fluxnova (Camunda 7-based) REST API.
 *
 * Tokens are held in memory only and are never written to disk.
 */
class OIDCAPI {

  /**
   * @param { (url: string) => void } browserOpen
   * @param { { error: Function, info: Function } } [log]
   */
  constructor(browserOpen, log) {
    this._browserOpen = browserOpen;
    this._log = log;

    this._issuers = new Map();
    this._clients = new Map();
    this._tokens = new Map();
  }

  /**
   * Perform an interactive login via the system browser.
   *
   * @param { { issuerUrl: string, clientId: string, scope?: string } } options
   * @return { Promise<{ success: boolean, reason?: string }> }
   */
  async login(options = {}) {
    let config;

    try {
      config = parseConfiguration(options);
    } catch (error) {
      return failure(ERROR_REASONS.INVALID_CONFIGURATION);
    }

    let issuer;

    try {
      issuer = await this._getIssuer(config.issuerUrl);
    } catch (error) {
      this._logError('OIDC discovery failed', error);

      return failure(ERROR_REASONS.DISCOVERY_FAILED);
    }

    const server = await createLoopbackServer();

    const redirectUri = `http://${LOOPBACK_HOST}:${server.address().port}${CALLBACK_PATH}`;

    const client = new issuer.Client({
      client_id: config.clientId,
      redirect_uris: [ redirectUri ],
      response_types: [ 'code' ],

      // desktop apps are public clients and hold no secret
      token_endpoint_auth_method: 'none'
    });

    const codeVerifier = generators.codeVerifier();

    const checks = {
      code_verifier: codeVerifier,
      state: generators.state()
    };

    const authorizationUrl = client.authorizationUrl({
      scope: config.scope,
      state: checks.state,
      code_challenge: generators.codeChallenge(codeVerifier),
      code_challenge_method: 'S256',
      redirect_uri: redirectUri
    });

    try {
      const tokenSet = await this._awaitCallback(server, client, redirectUri, checks, authorizationUrl);

      this._clients.set(config.key, client);
      this._tokens.set(config.key, toTokenEntry(tokenSet));

      return { success: true };
    } catch (error) {
      this._logError('OIDC login failed', error);

      return failure(error.reason || ERROR_REASONS.LOGIN_FAILED);
    } finally {
      server.close();
    }
  }

  /**
   * Return a valid access token, refreshing it silently when possible.
   *
   * @param { { issuerUrl: string, clientId: string, scope?: string } } options
   * @return { Promise<{ success: boolean, token?: string, reason?: string }> }
   */
  async getToken(options = {}) {
    let config;

    try {
      config = parseConfiguration(options);
    } catch (error) {
      return failure(ERROR_REASONS.INVALID_CONFIGURATION);
    }

    const entry = this._tokens.get(config.key);

    if (!entry) {
      return failure(ERROR_REASONS.NOT_AUTHENTICATED);
    }

    if (!isExpired(entry)) {
      return { success: true, token: entry.accessToken };
    }

    if (!entry.refreshToken) {
      this._tokens.delete(config.key);

      return failure(ERROR_REASONS.NOT_AUTHENTICATED);
    }

    const client = this._clients.get(config.key);

    if (!client) {
      this._tokens.delete(config.key);

      return failure(ERROR_REASONS.NOT_AUTHENTICATED);
    }

    try {
      const tokenSet = await client.refresh(entry.refreshToken);

      const refreshed = toTokenEntry(tokenSet, entry.refreshToken);

      this._tokens.set(config.key, refreshed);

      return { success: true, token: refreshed.accessToken };
    } catch (error) {
      this._logError('OIDC token refresh failed', error);

      this._tokens.delete(config.key);

      return failure(ERROR_REASONS.NOT_AUTHENTICATED);
    }
  }

  /**
   * Discard the cached tokens for the given configuration.
   *
   * @param { { issuerUrl: string, clientId: string } } options
   * @return { Promise<{ success: boolean }> }
   */
  async logout(options = {}) {
    try {
      const { key } = parseConfiguration(options);

      this._tokens.delete(key);
      this._clients.delete(key);
    } catch (error) {
      return failure(ERROR_REASONS.INVALID_CONFIGURATION);
    }

    return { success: true };
  }

  async _getIssuer(issuerUrl) {
    if (this._issuers.has(issuerUrl)) {
      return this._issuers.get(issuerUrl);
    }

    const issuer = await Issuer.discover(issuerUrl);

    this._issuers.set(issuerUrl, issuer);

    return issuer;
  }

  _awaitCallback(server, client, redirectUri, checks, authorizationUrl) {

    return new Promise((resolve, reject) => {

      const timeout = setTimeout(() => {
        cleanup();

        reject(withReason(new Error('login timed out'), ERROR_REASONS.LOGIN_TIMEOUT));
      }, LOGIN_TIMEOUT);

      const onRequest = async (req, res) => {
        const { pathname } = new URL(req.url, redirectUri);

        if (pathname !== CALLBACK_PATH) {
          res.writeHead(404);
          res.end();

          return;
        }

        try {
          const params = client.callbackParams(req);

          const tokenSet = await client.callback(redirectUri, params, checks);

          respond(res, 200, SUCCESS_HTML);

          cleanup();
          resolve(tokenSet);
        } catch (error) {
          respond(res, 400, FAILURE_HTML);

          cleanup();
          reject(error);
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        server.removeListener('request', onRequest);
      };

      server.on('request', onRequest);

      Promise.resolve(this._browserOpen(authorizationUrl)).catch(error => {
        cleanup();

        reject(withReason(error, ERROR_REASONS.LOGIN_FAILED));
      });
    });
  }

  _logError(message, error) {
    if (this._log) {
      this._log.error(message, error);
    }
  }
}

module.exports = OIDCAPI;


// helpers //////////

function parseConfiguration(options) {
  const {
    issuerUrl,
    clientId,
    scope
  } = options;

  if (!issuerUrl || !clientId) {
    throw new Error('issuerUrl and clientId are required');
  }

  return {
    issuerUrl,
    clientId,
    scope: scope || DEFAULT_SCOPE,
    key: `${issuerUrl}|${clientId}`
  };
}

function createLoopbackServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();

    server.once('error', reject);

    server.listen(0, LOOPBACK_HOST, () => resolve(server));
  });
}

function toTokenEntry(tokenSet, fallbackRefreshToken) {
  return {
    accessToken: tokenSet.access_token,

    // providers may omit a rotated refresh token, keep the previous one
    refreshToken: tokenSet.refresh_token || fallbackRefreshToken,
    expiresAt: tokenSet.expires_at
  };
}

function isExpired(entry) {
  if (!entry.expiresAt) {
    return false;
  }

  return entry.expiresAt - EXPIRY_SKEW <= Math.floor(Date.now() / 1000);
}

function respond(res, statusCode, html) {
  res.writeHead(statusCode, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

function withReason(error, reason) {
  error.reason = reason;

  return error;
}

function failure(reason) {
  return { success: false, reason };
}
