'use strict';

module.exports = {
  panel: `
    <div id="agent-custom-properties">
      <div class="agent-panel-title">Agent Configuration</div>
      <div class="agent-fields-container"></div>
    </div>`,

  inputField: `
    <div class="agent-form-row">
      <label class="agent-form-label"></label>
      <input type="text" class="agent-form-input" />
    </div>`,

  textareaField: `
    <div class="agent-form-row">
      <label class="agent-form-label"></label>
      <textarea class="agent-form-textarea" rows="5"></textarea>
    </div>`,

  variablesContainer: `
    <div class="agent-variables-container">
      <div class="agent-variables-header">
        <div class="agent-variables-title">Context Variables</div>
        <button class="agent-btn-add">+ Add Variable</button>
      </div>
      <div class="agent-variables-list"></div>
    </div>`,

  variableRow: `
    <div class="agent-variable-row">
      <input type="text" class="agent-variable-name" placeholder="Variable name" />
      <button class="agent-btn-remove">X</button>
    </div>`,

  emptyVariables: `
    <div class="agent-variables-empty">No context variables defined</div>`,

  aiBadge: `
    <div class="agent-ai-badge">
      <svg width="28" height="20" viewBox="0 0 28 20">
        <rect x="0" y="0" width="28" height="20" rx="4" fill="#7c3aed" />
        <text x="14" y="14.5" font-family="Arial" font-size="12" font-weight="bold" fill="#fff" text-anchor="middle">AI</text>
      </svg>
    </div>`
};
