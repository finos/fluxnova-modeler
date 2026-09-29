/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import AUTH_TYPES from './AuthTypes';

import RestAPI, { ConnectionError, GenericApiErrorMessages, getNetworkErrorCode, getResponseErrorCode } from './RestAPI';

// matches the Fluxnova engine's fluxnova.bpm.jwt.header-name and Control Center's FXN_IDENTITY_HEADER_KEY defaults
const DEFAULT_IDENTITY_HEADER_NAME = 'x-fxn-identity-token';

export default class CamundaAPI extends RestAPI {

  constructor(endpoint, oidcAPI) {
    super('CamundaAPI', normalizeBaseURL(endpoint.url), getAuthentication(endpoint, oidcAPI));
  }

  async deployDiagram(diagram, deployment) {
    const {
      name,
      tenantId,
      attachments = []
    } = deployment;

    const form = new FormData();

    form.append('deployment-name', name);
    form.append('deployment-source', 'Fluxnova Modeler');

    // make sure that we do not re-deploy already existing deployment
    form.append('enable-duplicate-filtering', 'true');

    if (tenantId) {
      form.append('tenant-id', tenantId);
    }

    const diagramName = diagram.name;

    const blob = new Blob([ diagram.contents ], { type: 'text/xml' });

    form.append(diagramName, blob, diagramName);

    attachments.forEach(file => {
      form.append(file.name, new Blob([ file.contents ]), file.name);
    });

    const response = await this.fetch('/deployment/create', {
      method: 'POST',
      body: form
    });

    if (response.ok) {

      const {
        id,
        deployedProcessDefinitions
      } = await response.json();

      return {
        id,
        deployedProcessDefinitions,
        deployedProcessDefinition: Object.values(deployedProcessDefinitions || {})[0]
      };
    }

    const body = await this.parse(response);

    throw new DeploymentError(response, body);
  }

  async startInstance(processDefinition, options) {

    const {
      businessKey,
      variables
    } = options;

    const response = await this.fetch(`/process-definition/${processDefinition.id}/start`, {
      method: 'POST',
      body: JSON.stringify({
        businessKey,
        variables
      }),
      headers: {
        'content-type': 'application/json'
      }
    });

    if (response.ok) {
      return await response.json();
    }

    const body = await this.parse(response);

    throw new StartInstanceError(response, body);
  }

  async checkConnection() {

    const response = await this.fetch('/deployment?maxResults=0');

    if (response.ok) {
      return;
    }

    throw new ConnectionError(response);
  }

  async getVersion() {

    const response = await this.fetch('/version');

    if (response.ok) {
      const { version } = await response.json();
      return {
        version: version
      };
    }

    throw new ConnectionError(response);
  }
}

function getAuthentication(endpoint, oidcAPI) {

  const {
    authType,
    username,
    password,
    token
  } = endpoint;

  switch (authType) {
  case AUTH_TYPES.BASIC:
    return {
      username,
      password
    };
  case AUTH_TYPES.BEARER:
    return {
      token
    };
  case AUTH_TYPES.OIDC:
    if (!oidcAPI) {
      return;
    }

    // resolved per request; an unauthenticated result falls through to a 401
    return async () => {
      const result = await oidcAPI.getToken(endpoint);

      if (result && result.success) {
        return {
          token: result.token,
          identityHeaderName: endpoint.identityHeaderName || DEFAULT_IDENTITY_HEADER_NAME,
          identityHeaderPrefix: endpoint.identityHeaderPrefix || ''
        };
      }
    };
  }
}

/**
 * Retrieve the optional oidcAPI global without throwing when it is not registered
 * (App#getGlobal throws for any key that is not exposed via globals).
 *
 * @param { { _getGlobal?: (name: string) => any } } props
 */
export function getOidcAPI(props) {
  try {
    return props._getGlobal?.('oidcAPI');
  } catch (error) {
    return null;
  }
}

const DIAGRAM_PARSE_ERROR = 'DIAGRAM_PARSE_ERROR';

export const ApiErrors = {
  DIAGRAM_PARSE_ERROR,
};

export const ApiErrorMessages = {
  [ DIAGRAM_PARSE_ERROR ]: 'Server could not parse the diagram. Please check log for errors.',
};

export class DeploymentError extends Error {

  constructor(response, body) {
    super('Deployment failed');

    this.code = (
      getCamundaErrorCode(response, body) ||
      getResponseErrorCode(response) ||
      getNetworkErrorCode(response)
    );

    this.details = ApiErrorMessages[this.code] || GenericApiErrorMessages[this.code];

    this.problems = body && body.message;
  }
}

export class StartInstanceError extends Error {

  constructor(response, body) {
    super('Starting instance failed');

    this.code = (
      getCamundaErrorCode(response, body) ||
      getResponseErrorCode(response) ||
      getNetworkErrorCode(response)
    );

    this.details = ApiErrorMessages[this.code] || GenericApiErrorMessages[this.code];

    this.problems = body && body.message;
  }
}


// helpers ///////////////

function getCamundaErrorCode(response, body) {

  const PARSE_ERROR_PREFIX = 'ENGINE-09005 Could not parse BPMN process.';

  if (body && body.message && body.message.startsWith(PARSE_ERROR_PREFIX)) {
    return DIAGRAM_PARSE_ERROR;
  }
}

function normalizeBaseURL(url) {
  return url.replace(/\/deployment\/create\/?/, '');
}
