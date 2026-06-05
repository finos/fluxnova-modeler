'use strict';

const domify = require('domify');
const AgentUtil = require('../util/AgentUtil');
const TEMPLATES = require('../templates');

function AgentPropertiesProvider(eventBus, modeling, moddle) {
  // propertiesPanel.updated fires inside the BpmnPropertiesPanel Preact component's
  // _update() helper on every selection.changed AND elements.changed event, carrying
  // the newly-selected element as event.element. Crucially it fires just BEFORE the
  // corresponding setState() call that triggers the Preact re-render, so we must
  // defer our DOM injection until after Preact has flushed.
  //
  // (propertiesPanel.rendered, by contrast, only fires once – on root.added – and
  //  is therefore useless for per-selection injection.)
  //
  // requestAnimationFrame() runs after all pending microtasks (including Preact's
  // batched state flush) and before the browser paints, guaranteeing that
  // .bio-properties-panel-container already contains the final DOM for the new
  // element when we insert our panel as its first child.
  let pendingRaf = null;

  eventBus.on('propertiesPanel.updated', (event) => {
    const element = event.element;

    // Cancel any injection scheduled for a previous update that hasn't fired yet.
    if (pendingRaf !== null) {
      cancelAnimationFrame(pendingRaf);
      pendingRaf = null;
    }

    if (
      !element ||
      element.type !== 'bpmn:AdHocSubProcess' ||
      !AgentUtil.isAgenticSubprocess(element.businessObject)
    ) {
      removeCustomPanel();
      return;
    }

    pendingRaf = requestAnimationFrame(() => {
      pendingRaf = null;

      // Skip re-injection when the panel is already present for this element so
      // that focused inputs are not disrupted while the user is editing values.
      const existing = document.getElementById('agent-custom-properties');
      if (existing && existing.getAttribute('data-element-id') === element.id) {
        return;
      }

      injectCustomPanel(element, modeling, moddle);
    });
  });
}

AgentPropertiesProvider.$inject = ['eventBus', 'modeling', 'moddle'];

function removeCustomPanel() {
  const existing = document.getElementById('agent-custom-properties');
  if (existing) existing.remove();
}

function injectCustomPanel(element, modeling, moddle) {
  removeCustomPanel();

  // bpmn-js-properties-panel v5 renders into a div.bio-properties-panel-container.
  // The old .bio-properties-panel-scroll-container class does not exist in v5.
  const container = document.querySelector('.bio-properties-panel-container');
  if (!container) return;

  const bo = element.businessObject;
  const agentConfig = AgentUtil.getAgentConfig(bo);
  if (!agentConfig) return;

  const panel = domify(TEMPLATES.panel);
  panel.setAttribute('data-element-id', element.id);
  const fieldsContainer = panel.querySelector('.agent-fields-container');

  fieldsContainer.appendChild(
    createInputField(
      { label: 'Provider', prop: 'provider', placeholder: 'e.g. anthropic' },
      element,
      agentConfig,
      modeling
    )
  );

  fieldsContainer.appendChild(
    createInputField(
      { label: 'Model', prop: 'model', placeholder: 'e.g. claude-sonnet-4-6' },
      element,
      agentConfig,
      modeling
    )
  );

  fieldsContainer.appendChild(
    createTextareaField(
      {
        label: 'System Prompt',
        prop: 'systemPrompt',
        placeholder: 'Instructions for the LLM agent...',
      },
      element,
      agentConfig,
      modeling
    )
  );

  fieldsContainer.appendChild(
    createVariablesList(element, bo, modeling, moddle)
  );

  container.insertBefore(panel, container.firstChild);
}

function createInputField(field, element, agentConfig, modeling) {
  const row = domify(TEMPLATES.inputField);
  const label = row.querySelector('label');
  const input = row.querySelector('input');

  label.textContent = field.label;
  input.value = agentConfig.get(field.prop) || '';
  input.placeholder = field.placeholder || '';

  input.addEventListener('change', (e) => {
    modeling.updateModdleProperties(element, agentConfig, {
      [field.prop]: e.target.value,
    });
  });

  return row;
}

function createTextareaField(field, element, agentConfig, modeling) {
  const row = domify(TEMPLATES.textareaField);
  const label = row.querySelector('label');
  const textarea = row.querySelector('textarea');

  label.textContent = field.label;
  textarea.value = agentConfig.get(field.prop) || '';
  textarea.placeholder = field.placeholder || '';

  textarea.addEventListener('change', (e) => {
    modeling.updateModdleProperties(element, agentConfig, {
      [field.prop]: e.target.value,
    });
  });

  return row;
}

function createVariablesList(element, bo, modeling, moddle) {
  const container = domify(TEMPLATES.variablesContainer);
  const addBtn = container.querySelector('.agent-btn-add');
  const listContainer = container.querySelector('.agent-variables-list');

  const render = () => {
    listContainer.innerHTML = '';
    const variables = AgentUtil.getContextVariables(bo);

    if (variables.length === 0) {
      listContainer.appendChild(domify(TEMPLATES.emptyVariables));
      return;
    }

    variables.forEach((variable, index) => {
      const row = domify(TEMPLATES.variableRow);
      const nameInput = row.querySelector('.agent-variable-name');
      const removeBtn = row.querySelector('.agent-btn-remove');

      nameInput.value = variable.name || '';
      nameInput.addEventListener('change', (e) => {
        variable.name = e.target.value;
        AgentUtil.updateModdle(element, bo, modeling);
      });

      removeBtn.addEventListener('click', () => {
        variables.splice(index, 1);
        AgentUtil.updateModdle(element, bo, modeling);
        render();
      });

      listContainer.appendChild(row);
    });
  };

  addBtn.addEventListener('click', () => {
    let context = AgentUtil.getAgentContext(bo);
    if (!context) {
      const extensionElements = bo.get('extensionElements');
      context = moddle.create('agent:Context', { variables: [] });
      context.$parent = extensionElements;
      extensionElements.get('values').push(context);
    }

    const newVar = moddle.create('agent:Variable', { name: '' });
    newVar.$parent = context;
    context.get('variables').push(newVar);

    AgentUtil.updateModdle(element, bo, modeling);
    render();
  });

  render();
  return container;
}

module.exports = AgentPropertiesProvider;
