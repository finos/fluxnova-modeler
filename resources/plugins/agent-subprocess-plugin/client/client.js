'use strict';

const {
  registerBpmnJSPlugin,
  registerBpmnJSModdleExtension,
} = require('camunda-modeler-plugin-helpers');

const AgentCreateAppendProvider = require('./provider/AgentCreateAppendProvider');
const AgentReplaceMenuProvider = require('./provider/AgentReplaceMenuProvider');
const AgentPropertiesProvider = require('./provider/AgentPropertiesProvider');
const AgentOverlayProvider = require('./provider/AgentOverlayProvider');

registerBpmnJSModdleExtension({
  name: 'agent',
  prefix: 'agent',
  uri: 'http://fluxnova.finos.org/schema/1.0/ai/agent',
  xml: { tagAlias: 'lowerCase' },
  types: [
    {
      name: 'Config',
      superClass: ['Element'],
      properties: [
        { name: 'provider', isAttr: true, type: 'String' },
        { name: 'model', isAttr: true, type: 'String' },
        { name: 'systemPrompt', isAttr: true, type: 'String' },
      ],
    },
    {
      name: 'Context',
      superClass: ['Element'],
      properties: [{ name: 'variables', type: 'agent:Variable', isMany: true }],
    },
    {
      name: 'Variable',
      superClass: ['Element'],
      properties: [{ name: 'name', isAttr: true, type: 'String' }],
    },
  ],
});

registerBpmnJSPlugin({
  __init__: [
    'agentCreateAppendProvider',
    'agentReplaceMenuProvider',
    'agentPropertiesProvider',
    'agentOverlayProvider',
  ],
  agentCreateAppendProvider: ['type', AgentCreateAppendProvider],
  agentReplaceMenuProvider: ['type', AgentReplaceMenuProvider],
  agentPropertiesProvider: ['type', AgentPropertiesProvider],
  agentOverlayProvider: ['type', AgentOverlayProvider],
});
