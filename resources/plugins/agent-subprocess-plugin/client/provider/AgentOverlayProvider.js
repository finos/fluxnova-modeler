'use strict';

const domify = require('domify');
const AgentUtil = require('../util/AgentUtil');
const TEMPLATES = require('../templates');

function AgentOverlayProvider(eventBus, overlays, elementRegistry) {
  eventBus.on('import.done', () => {
    elementRegistry
      .getAll()
      .forEach((element) => syncOverlay(element, overlays));
  });

  eventBus.on('element.changed', (e) => {
    syncOverlay(e.element || null, overlays);
  });

  eventBus.on('elements.changed', (e) => {
    const elements = e.elements || [];

    elements.forEach((element) => syncOverlay(element, overlays));
  });
}

function syncOverlay(element, overlays) {
  if (!element || element.type !== 'bpmn:AdHocSubProcess') {
    return;
  }

  if (AgentUtil.isAgenticSubprocess(element.businessObject)) {
    addAiOverlay(element, overlays);
  } else {
    removeAiOverlay(element, overlays);
  }
}

AgentOverlayProvider.$inject = ['eventBus', 'overlays', 'elementRegistry'];

function addAiOverlay(element, overlays) {
  if (!overlays) return;

  try {
    removeAiOverlay(element, overlays);
    const badge = domify(TEMPLATES.aiBadge);

    overlays.add(element, 'agent-ai-badge', {
      position: { top: 4, left: 4 },
      html: badge,
    });
  } catch (err) {
    console.log('[Agent Subprocess Plugin] Error adding overlay:', err.message);
  }
}

function removeAiOverlay(element, overlays) {
  if (!overlays) return;
  try {
    overlays.remove({ element, type: 'agent-ai-badge' });
  } catch (err) {
    console.log('[Agent Subprocess Plugin] Error removing overlay:', err.message);
  }
}

module.exports = AgentOverlayProvider;
