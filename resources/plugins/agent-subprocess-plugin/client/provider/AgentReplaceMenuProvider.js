'use strict';

const AgentUtil = require('../util/AgentUtil');

function AgentReplaceMenuProvider(
  popupMenu,
  modeling,
  bpmnFactory,
  bpmnReplace
) {
  this._modeling = modeling;
  this._bpmnFactory = bpmnFactory;
  this._bpmnReplace = bpmnReplace;
  popupMenu.registerProvider('bpmn-replace', this);
}

AgentReplaceMenuProvider.$inject = [
  'popupMenu',
  'modeling',
  'bpmnFactory',
  'bpmnReplace',
];

AgentReplaceMenuProvider.prototype.getPopupMenuEntries = (element) => {
  const {
    _modeling: modeling,
    _bpmnFactory: bpmnFactory,
    _bpmnReplace: bpmnReplace,
  } = this;
  const bo = element.businessObject;

  const isSubProcess = element.type === 'bpmn:SubProcess';
  const isAdHoc = element.type === 'bpmn:AdHocSubProcess';

  if (!isSubProcess && !isAdHoc) {
    return {};
  }

  // Only offer the revert when the element is already a proper agentic
  // ad-hoc subprocess (correct type AND extensions present).
  //
  // bpmn-js copies extensionElements when doing a standard type change, so a
  // plain SubProcess can end up with agent:Config already attached. Showing
  // the revert option there would hide the "Agentic Subprocess" promote path.
  // Always show "Agentic Subprocess" for SubProcess regardless of extensions.
  if (isAdHoc && AgentUtil.isAgenticSubprocess(bo)) {
    return {
      'replace-with-adhoc-subprocess': {
        label: 'Ad-Hoc Subprocess',
        className: 'bpmn-icon-subprocess-expanded',
        action: () => {
          AgentUtil.removeAgentExtensions(bo);
          AgentUtil.updateModdle(element, bo, modeling);
        },
      },
    };
  }

  return {
    'replace-with-agentic-subprocess': {
      label: 'Agentic Subprocess',
      className: 'bpmn-icon-agent-subprocess',
      action: () => {
        let target = element;

        if (isSubProcess) {
          target = bpmnReplace.replaceElement(element, {
            type: 'bpmn:AdHocSubProcess',
          });
        }

        // addAgentExtensions is idempotent: it checks before creating, so
        // extensions copied across by bpmnReplace are not duplicated.
        AgentUtil.addAgentExtensions(target.businessObject, bpmnFactory);
        AgentUtil.updateModdle(target, target.businessObject, modeling);
      },
    },
  };
};

module.exports = AgentReplaceMenuProvider;
