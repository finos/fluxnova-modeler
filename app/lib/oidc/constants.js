module.exports.ERROR_REASONS = {
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  DISCOVERY_FAILED: 'DISCOVERY_FAILED',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_TIMEOUT: 'LOGIN_TIMEOUT',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  REFRESH_FAILED: 'REFRESH_FAILED'
};

module.exports.DEFAULT_SCOPE = 'openid profile offline_access';

module.exports.LOOPBACK_HOST = 'localhost';

module.exports.CALLBACK_PATH = '/callback';

module.exports.LOGIN_TIMEOUT = 1000 * 60 * 5;

// renew slightly ahead of real expiry to avoid races with in-flight requests
module.exports.EXPIRY_SKEW = 60;
