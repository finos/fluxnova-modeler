'use strict';

const AgentUtil = require('../util/AgentUtil');

// Must match the SUBPROCESS_GROUP id/name used by bpmn-js-create-append-anything
// so our entry is rendered under the same 'Sub-processes' heading.
const SUBPROCESS_GROUP = {
  id: 'subprocess',
  name: 'Sub-processes'
};

/**
 * Registers an 'Agentic Sub-process' entry under the Sub-processes group in:
 *   - the 'bpmn-create' popup  (palette '...' button  – create from scratch)
 *   - the 'bpmn-append' popup  (context-pad '...' button – append after a shape)
 */
function AgentCreateAppendProvider(
    popupMenu, create, elementFactory, bpmnFactory,
    autoPlace, mouse, translate) {

  this._create = create;
  this._elementFactory = elementFactory;
  this._bpmnFactory = bpmnFactory;
  this._autoPlace = autoPlace;
  this._mouse = mouse;
  this._translate = translate;
  this._popupMenu = popupMenu;

  popupMenu.registerProvider('bpmn-create', this);
  popupMenu.registerProvider('bpmn-append', this);
}

AgentCreateAppendProvider.$inject = [
  'popupMenu', 'create', 'elementFactory', 'bpmnFactory',
  'autoPlace', 'mouse', 'translate'
];

/**
 * Called by the popup menu for both 'bpmn-create' and 'bpmn-append'.
 *
 * For 'bpmn-create' the popup is opened with canvas.getRootElement() as the
 * target — a root element has no parent.  For 'bpmn-append' the target is the
 * actual source shape the user wants to append from — it always has a parent.
 * We use that distinction to route to the correct action.
 *
 * @param {djs.model.Base} element  Root element (create) or source shape (append).
 * @returns {Object} Popup menu entries.
 */
AgentCreateAppendProvider.prototype.getPopupMenuEntries = function(element) {
  const self = this;
  const translate = this._translate;

  // Root canvas element has no parent; a real flow element always does.
  const isCreate = !element || !element.parent;

  return {
    'create-agentic-subprocess': {
      label: translate('Agentic Sub-process'),
      className: 'bpmn-icon-subprocess-expanded',
      group: {
        id: SUBPROCESS_GROUP.id,
        name: translate(SUBPROCESS_GROUP.name)
      },
      search: 'agentic subprocess agent ai',

      // Rank just after the standard ad-hoc sub-process entries (rank ~760 in
      // bpmn-js-create-append-anything) so it appears at the bottom of the group.
      rank: 800,

      action: {
        // Create (palette): manual placement on canvas.
        // Append (context pad, click): auto-place next to the source element.
        click: isCreate
          ? (event) => self._createStart(event)
          : ()      => self._appendClick(element),

        // Drag always starts manual placement; include source hint when appending.
        dragstart: isCreate
          ? (event) => self._createStart(event)
          : (event) => self._createStart(event, element)
      }
    }
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the new shape with agent extensions already attached.
 */
AgentCreateAppendProvider.prototype._buildShape = function() {
  const shape = this._elementFactory.createShape({
    type: 'bpmn:AdHocSubProcess',
    isExpanded: true
  });
  AgentUtil.addAgentExtensions(shape.businessObject, this._bpmnFactory);
  return shape;
};

/**
 * Auto-place the new shape next to the source element (append-click path).
 */
AgentCreateAppendProvider.prototype._appendClick = function(source) {
  this._popupMenu.close();
  this._autoPlace.append(source, this._buildShape());
};

/**
 * Start the manual-placement drag interaction (create path and append-drag path).
 *
 * @param {MouseEvent|KeyboardEvent} event
 * @param {djs.model.Base} [source]  Present only when triggered from the append menu.
 */
AgentCreateAppendProvider.prototype._createStart = function(event, source) {
  this._popupMenu.close();

  // Keyboard shortcuts fire KeyboardEvents; resolve to the last mouse position.
  if (event instanceof KeyboardEvent) {
    event = this._mouse.getLastMoveEvent();
  }

  this._create.start(
    event,
    this._buildShape(),
    source ? { source } : undefined
  );
};

module.exports = AgentCreateAppendProvider;
