'use strict';

const http = require('http');
const proxyquire = require('proxyquire');

const { ERROR_REASONS } = require('../../lib/oidc/constants');

const ENDPOINT = {
  issuerUrl: 'https://idp.example.com',
  clientId: 'modeler'
};


describe('OIDCAPI', function() {

  describe('#login', function() {

    it('should reject incomplete configuration', async function() {

      // given
      const oidcAPI = createOIDCAPI();

      // when
      const result = await oidcAPI.login({ issuerUrl: 'https://idp.example.com' });

      // then
      expect(result.success).to.be.false;
      expect(result.reason).to.eql(ERROR_REASONS.INVALID_CONFIGURATION);
    });


    it('should report failed discovery', async function() {

      // given
      const oidcAPI = createOIDCAPI({
        discover: () => Promise.reject(new Error('unreachable'))
      });

      // when
      const result = await oidcAPI.login(ENDPOINT);

      // then
      expect(result.success).to.be.false;
      expect(result.reason).to.eql(ERROR_REASONS.DISCOVERY_FAILED);
    });


    it('should complete the authorization code flow', async function() {

      // given
      const oidcAPI = createOIDCAPI();

      // when
      const result = await oidcAPI.login(ENDPOINT);

      // then
      expect(result.success).to.be.true;
    });


    it('should report a failed code exchange', async function() {

      // given
      const oidcAPI = createOIDCAPI({
        callback: () => Promise.reject(new Error('state mismatch'))
      });

      // when
      const result = await oidcAPI.login(ENDPOINT);

      // then
      expect(result.success).to.be.false;
      expect(result.reason).to.eql(ERROR_REASONS.LOGIN_FAILED);
    });


    it('should report a failed browser launch', async function() {

      // given
      const oidcAPI = createOIDCAPI({
        browserOpen: () => Promise.reject(new Error('browser unavailable'))
      });

      // when
      const result = await oidcAPI.login(ENDPOINT);

      // then
      expect(result.success).to.be.false;
      expect(result.reason).to.eql(ERROR_REASONS.LOGIN_FAILED);
    });

  });


  describe('#getToken', function() {

    it('should report missing session', async function() {

      // given
      const oidcAPI = createOIDCAPI();

      // when
      const result = await oidcAPI.getToken(ENDPOINT);

      // then
      expect(result.success).to.be.false;
      expect(result.reason).to.eql(ERROR_REASONS.NOT_AUTHENTICATED);
    });


    it('should return a cached token', async function() {

      // given
      const oidcAPI = createOIDCAPI();

      await oidcAPI.login(ENDPOINT);

      // when
      const result = await oidcAPI.getToken(ENDPOINT);

      // then
      expect(result.success).to.be.true;
      expect(result.token).to.eql('access-token');
    });


    it('should refresh an expired token', async function() {

      // given
      const refreshed = {
        access_token: 'refreshed-token',
        refresh_token: 'refresh-token',
        expires_at: nowInSeconds() + 3600
      };

      const oidcAPI = createOIDCAPI({
        tokenSet: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: nowInSeconds() - 10
        },
        refresh: () => Promise.resolve(refreshed)
      });

      await oidcAPI.login(ENDPOINT);

      // when
      const result = await oidcAPI.getToken(ENDPOINT);

      // then
      expect(result.success).to.be.true;
      expect(result.token).to.eql('refreshed-token');
    });


    it('should discard the session when refresh fails', async function() {

      // given
      const oidcAPI = createOIDCAPI({
        tokenSet: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: nowInSeconds() - 10
        },
        refresh: () => Promise.reject(new Error('invalid_grant'))
      });

      await oidcAPI.login(ENDPOINT);

      // when
      const result = await oidcAPI.getToken(ENDPOINT);

      // then
      expect(result.success).to.be.false;
      expect(result.reason).to.eql(ERROR_REASONS.NOT_AUTHENTICATED);
    });

  });


  describe('#logout', function() {

    it('should discard the cached token', async function() {

      // given
      const oidcAPI = createOIDCAPI();

      await oidcAPI.login(ENDPOINT);

      // when
      await oidcAPI.logout(ENDPOINT);

      // then
      const result = await oidcAPI.getToken(ENDPOINT);

      expect(result.success).to.be.false;
      expect(result.reason).to.eql(ERROR_REASONS.NOT_AUTHENTICATED);
    });

  });

});


// helpers //////////

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Create an OIDCAPI with a stubbed identity provider. The stubbed browser
 * plays the part of the user by calling back into the loopback server.
 */
function createOIDCAPI(options = {}) {

  const tokenSet = options.tokenSet || {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_at: nowInSeconds() + 3600
  };

  class Client {
    authorizationUrl(params) {
      return `https://idp.example.com/authorize?redirect_uri=${ encodeURIComponent(params.redirect_uri) }`;
    }

    callbackParams() {
      return { code: 'code', state: 'state' };
    }

    callback() {
      return (options.callback || (() => Promise.resolve(tokenSet)))();
    }

    refresh() {
      return (options.refresh || (() => Promise.resolve(tokenSet)))();
    }
  }

  const OIDCAPI = proxyquire('../../lib/oidc/oidc-api', {
    'openid-client': {
      Issuer: {
        discover: options.discover || (() => Promise.resolve({ Client }))
      },
      generators: {
        codeVerifier: () => 'verifier',
        codeChallenge: () => 'challenge',
        state: () => 'state'
      },
      '@noCallThru': true
    }
  });

  const browserOpen = options.browserOpen || (url => {
    const redirectUri = new URL(url).searchParams.get('redirect_uri');

    http.get(`${redirectUri}?code=code&state=state`, (res) => res.resume());
  });

  return new OIDCAPI(browserOpen);
}
