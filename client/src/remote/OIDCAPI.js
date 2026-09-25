export const ERROR_REASONS = {
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  DISCOVERY_FAILED: 'DISCOVERY_FAILED',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_TIMEOUT: 'LOGIN_TIMEOUT',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  REFRESH_FAILED: 'REFRESH_FAILED'
};

/**
 * OIDC API for interactive login and token retrieval.
 */
export default class OIDCAPI {

  constructor(backend) {
    this.backend = backend;
  }

  login(endpoint) {
    return this.backend.send('oidc:login', getConfiguration(endpoint));
  }

  getToken(endpoint) {
    return this.backend.send('oidc:getToken', getConfiguration(endpoint));
  }

  logout(endpoint) {
    return this.backend.send('oidc:logout', getConfiguration(endpoint));
  }
}


// helpers //////////

function getConfiguration(endpoint = {}) {
  const {
    issuerUrl,
    clientId,
    scope
  } = endpoint;

  return {
    issuerUrl,
    clientId,
    scope
  };
}
