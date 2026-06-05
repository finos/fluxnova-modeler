'use strict';

function getAgentConfig(bo) {
  const extensionElements = bo.get('extensionElements');
  if (!extensionElements) return null;
  return extensionElements.get('values').find(v => v.$type === 'agent:Config') || null;
}

function getAgentContext(bo) {
  const extensionElements = bo.get('extensionElements');
  if (!extensionElements) return null;
  return extensionElements.get('values').find(v => v.$type === 'agent:Context') || null;
}

function isAgenticSubprocess(bo) {
  return !!getAgentConfig(bo);
}

function getContextVariables(bo) {
  const context = getAgentContext(bo);
  return context ? (context.get('variables') || []) : [];
}

function updateModdle(element, bo, modeling) {
  modeling.updateModdleProperties(element, bo, {
    extensionElements: bo.get('extensionElements')
  });
}

function addAgentExtensions(bo, bpmnFactory) {
  let extensionElements = bo.get('extensionElements');
  if (!extensionElements) {
    extensionElements = bpmnFactory.create('bpmn:ExtensionElements', { values: [] });
    extensionElements.$parent = bo;
    bo.extensionElements = extensionElements;
  }

  if (!getAgentConfig(bo)) {
    const config = bpmnFactory.create('agent:Config', {
      provider: '', model: '', systemPrompt: ''
    });
    config.$parent = extensionElements;
    extensionElements.get('values').push(config);
  }

  if (!getAgentContext(bo)) {
    const context = bpmnFactory.create('agent:Context', { variables: [] });
    context.$parent = extensionElements;
    extensionElements.get('values').push(context);
  }
}

function removeAgentExtensions(bo) {
  const extensionElements = bo.get('extensionElements');
  if (!extensionElements) return;

  const values   = extensionElements.get('values');
  const filtered = values.filter(v => v.$type !== 'agent:Config' && v.$type !== 'agent:Context');
  values.splice(0, values.length, ...filtered);
}

module.exports = {
  isAgenticSubprocess,
  getAgentConfig,
  getAgentContext,
  getContextVariables,
  updateModdle,
  addAgentExtensions,
  removeAgentExtensions
};
