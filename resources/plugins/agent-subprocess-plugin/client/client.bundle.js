/******/ (() => {
  // webpackBootstrap
  /******/ var __webpack_modules__ = {
    /***/ './client/provider/AgentCreateAppendProvider.js'(
      /*!******************************************************!*\
  !*** ./client/provider/AgentCreateAppendProvider.js ***!
  \******************************************************/
      module,
      __unused_webpack_exports,
      __webpack_require__
    ) {
      'use strict';

      const AgentUtil = __webpack_require__(
        /*! ../util/AgentUtil */ './client/util/AgentUtil.js'
      );

      // Must match the SUBPROCESS_GROUP id/name used by bpmn-js-create-append-anything
      // so our entry is rendered under the same 'Sub-processes' heading.
      const SUBPROCESS_GROUP = {
        id: 'subprocess',
        name: 'Sub-processes',
      };

      /**
       * Registers an 'Agentic Sub-process' entry under the Sub-processes group in:
       *   - the 'bpmn-create' popup  (palette '...' button  – create from scratch)
       *   - the 'bpmn-append' popup  (context-pad '...' button – append after a shape)
       */
      function AgentCreateAppendProvider(
        popupMenu,
        create,
        elementFactory,
        bpmnFactory,
        autoPlace,
        mouse,
        translate
      ) {
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
        'popupMenu',
        'create',
        'elementFactory',
        'bpmnFactory',
        'autoPlace',
        'mouse',
        'translate',
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
      AgentCreateAppendProvider.prototype.getPopupMenuEntries = function (
        element
      ) {
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
              name: translate(SUBPROCESS_GROUP.name),
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
                : () => self._appendClick(element),

              // Drag always starts manual placement; include source hint when appending.
              dragstart: isCreate
                ? (event) => self._createStart(event)
                : (event) => self._createStart(event, element),
            },
          },
        };
      };

      // ---------------------------------------------------------------------------
      // Helpers
      // ---------------------------------------------------------------------------

      /**
       * Build the new shape with agent extensions already attached.
       */
      AgentCreateAppendProvider.prototype._buildShape = function () {
        const shape = this._elementFactory.createShape({
          type: 'bpmn:AdHocSubProcess',
          isExpanded: true,
        });
        AgentUtil.addAgentExtensions(shape.businessObject, this._bpmnFactory);
        return shape;
      };

      /**
       * Auto-place the new shape next to the source element (append-click path).
       */
      AgentCreateAppendProvider.prototype._appendClick = function (source) {
        this._popupMenu.close();
        this._autoPlace.append(source, this._buildShape());
      };

      /**
       * Start the manual-placement drag interaction (create path and append-drag path).
       *
       * @param {MouseEvent|KeyboardEvent} event
       * @param {djs.model.Base} [source]  Present only when triggered from the append menu.
       */
      AgentCreateAppendProvider.prototype._createStart = function (
        event,
        source
      ) {
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

      /***/
    },

    /***/ './client/provider/AgentOverlayProvider.js'(
      /*!*************************************************!*\
  !*** ./client/provider/AgentOverlayProvider.js ***!
  \*************************************************/
      module,
      __unused_webpack_exports,
      __webpack_require__
    ) {
      'use strict';

      const domify = __webpack_require__(
        /*! domify */ './node_modules/domify/index.js'
      );
      const AgentUtil = __webpack_require__(
        /*! ../util/AgentUtil */ './client/util/AgentUtil.js'
      );
      const TEMPLATES = __webpack_require__(
        /*! ../templates */ './client/templates.js'
      );

      function AgentOverlayProvider(eventBus, overlays, elementRegistry) {
        const syncOverlay = (element) => {
          if (!element || element.type !== 'bpmn:AdHocSubProcess') {
            return;
          }

          const bo = element.businessObject;

          if (AgentUtil.isAgenticSubprocess(bo)) {
            addAiOverlay(element, overlays);
          } else {
            removeAiOverlay(element, overlays);
          }
        };

        eventBus.on('import.done', () => {
          elementRegistry.getAll().forEach(syncOverlay);
        });

        eventBus.on('element.changed', (e) => {
          syncOverlay(e.element || null);
        });

        eventBus.on('elements.changed', (e) => {
          const elements = e.elements || [];

          elements.forEach(syncOverlay);
        });
      }

      AgentOverlayProvider.$inject = [
        'eventBus',
        'overlays',
        'elementRegistry',
      ];

      function addAiOverlay(element, overlays) {
        if (!overlays) return;

        try {
          removeAiOverlay(element, overlays);
          const badge = domify(TEMPLATES.aiBadge);

          overlays.add(element, 'agent-ai-badge', {
            position: { top: 4, left: 4 },
            html: badge,
          });
        } catch (err) {}
      }

      function removeAiOverlay(element, overlays) {
        if (!overlays) return;
        try {
          overlays.remove({ element, type: 'agent-ai-badge' });
        } catch (err) {}
      }

      module.exports = AgentOverlayProvider;

      /***/
    },

    /***/ './client/provider/AgentPropertiesProvider.js'(
      /*!****************************************************!*\
  !*** ./client/provider/AgentPropertiesProvider.js ***!
  \****************************************************/
      module,
      __unused_webpack_exports,
      __webpack_require__
    ) {
      'use strict';

      const domify = __webpack_require__(
        /*! domify */ './node_modules/domify/index.js'
      );
      const AgentUtil = __webpack_require__(
        /*! ../util/AgentUtil */ './client/util/AgentUtil.js'
      );
      const TEMPLATES = __webpack_require__(
        /*! ../templates */ './client/templates.js'
      );

      function AgentPropertiesProvider(eventBus, modeling, bpmnFactory) {
        const moddle = bpmnFactory;

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
            if (
              existing &&
              existing.getAttribute('data-element-id') === element.id
            ) {
              return;
            }

            injectCustomPanel(element, modeling, moddle);
          });
        });
      }

      AgentPropertiesProvider.$inject = ['eventBus', 'modeling', 'bpmnFactory'];

      function removeCustomPanel() {
        const existing = document.getElementById('agent-custom-properties');
        if (existing) existing.remove();
      }

      function injectCustomPanel(element, modeling, moddle) {
        removeCustomPanel();

        // bpmn-js-properties-panel v5 renders into a div.bio-properties-panel-container.
        // The old .bio-properties-panel-scroll-container class does not exist in v5.
        const container = document.querySelector(
          '.bio-properties-panel-container'
        );
        if (!container) return;

        const bo = element.businessObject;
        const agentConfig = AgentUtil.getAgentConfig(bo);
        if (!agentConfig) return;

        const panel = domify(TEMPLATES.panel);
        panel.setAttribute('data-element-id', element.id);
        const fieldsContainer = panel.querySelector('.agent-fields-container');

        fieldsContainer.appendChild(
          createInputField(
            {
              label: 'Provider',
              prop: 'provider',
              placeholder: 'e.g. anthropic',
            },
            element,
            agentConfig,
            modeling
          )
        );

        fieldsContainer.appendChild(
          createInputField(
            {
              label: 'Model',
              prop: 'model',
              placeholder: 'e.g. claude-sonnet-4-6',
            },
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

      /***/
    },

    /***/ './client/provider/AgentReplaceMenuProvider.js'(
      /*!*****************************************************!*\
  !*** ./client/provider/AgentReplaceMenuProvider.js ***!
  \*****************************************************/
      module,
      __unused_webpack_exports,
      __webpack_require__
    ) {
      'use strict';

      const AgentUtil = __webpack_require__(
        /*! ../util/AgentUtil */ './client/util/AgentUtil.js'
      );

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

      AgentReplaceMenuProvider.prototype.getPopupMenuEntries = function (
        element
      ) {
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

      /***/
    },

    /***/ './client/templates.js'(
      /*!*****************************!*\
  !*** ./client/templates.js ***!
  \*****************************/
      module
    ) {
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
    </div>`,
      };

      /***/
    },

    /***/ './client/util/AgentUtil.js'(
      /*!**********************************!*\
  !*** ./client/util/AgentUtil.js ***!
  \**********************************/
      module
    ) {
      'use strict';

      function getAgentConfig(bo) {
        const extensionElements = bo.get('extensionElements');
        if (!extensionElements) return null;
        return (
          extensionElements
            .get('values')
            .find((v) => v.$type === 'agent:Config') || null
        );
      }

      function getAgentContext(bo) {
        const extensionElements = bo.get('extensionElements');
        if (!extensionElements) return null;
        return (
          extensionElements
            .get('values')
            .find((v) => v.$type === 'agent:Context') || null
        );
      }

      function isAgenticSubprocess(bo) {
        return !!getAgentConfig(bo);
      }

      function getContextVariables(bo) {
        const context = getAgentContext(bo);
        return context ? context.get('variables') || [] : [];
      }

      function updateModdle(element, bo, modeling) {
        modeling.updateModdleProperties(element, bo, {
          extensionElements: bo.get('extensionElements'),
        });
      }

      function addAgentExtensions(bo, bpmnFactory) {
        let extensionElements = bo.get('extensionElements');
        if (!extensionElements) {
          extensionElements = bpmnFactory.create('bpmn:ExtensionElements', {
            values: [],
          });
          extensionElements.$parent = bo;
          bo.extensionElements = extensionElements;
        }

        if (!getAgentConfig(bo)) {
          const config = bpmnFactory.create('agent:Config', {
            provider: '',
            model: '',
            systemPrompt: '',
          });
          config.$parent = extensionElements;
          extensionElements.get('values').push(config);
        }

        if (!getAgentContext(bo)) {
          const context = bpmnFactory.create('agent:Context', {
            variables: [],
          });
          context.$parent = extensionElements;
          extensionElements.get('values').push(context);
        }
      }

      function removeAgentExtensions(bo) {
        const extensionElements = bo.get('extensionElements');
        if (!extensionElements) return;

        const values = extensionElements.get('values');
        const filtered = values.filter(
          (v) => v.$type !== 'agent:Config' && v.$type !== 'agent:Context'
        );
        values.splice(0, values.length, ...filtered);
      }

      module.exports = {
        isAgenticSubprocess,
        getAgentConfig,
        getAgentContext,
        getContextVariables,
        updateModdle,
        addAgentExtensions,
        removeAgentExtensions,
      };

      /***/
    },

    /***/ './node_modules/camunda-modeler-plugin-helpers/index.js'(
      /*!**************************************************************!*\
  !*** ./node_modules/camunda-modeler-plugin-helpers/index.js ***!
  \**************************************************************/
      __unused_webpack_module,
      __webpack_exports__,
      __webpack_require__
    ) {
      'use strict';
      __webpack_require__.r(__webpack_exports__);
      /* harmony export */ __webpack_require__.d(__webpack_exports__, {
        /* harmony export */ getModelerDirectory: () =>
          /* binding */ getModelerDirectory,
        /* harmony export */ getPluginsDirectory: () =>
          /* binding */ getPluginsDirectory,
        /* harmony export */ registerBpmnJSModdleExtension: () =>
          /* binding */ registerBpmnJSModdleExtension,
        /* harmony export */ registerBpmnJSPlugin: () =>
          /* binding */ registerBpmnJSPlugin,
        /* harmony export */ registerClientPlugin: () =>
          /* binding */ registerClientPlugin,
        /* harmony export */
      });
      /**
       * Validate and register a client plugin.
       *
       * @param {Object} plugin
       * @param {String} type
       */
      function registerClientPlugin(plugin, type) {
        var plugins = window.plugins || [];
        window.plugins = plugins;

        if (!plugin) {
          throw new Error('plugin not specified');
        }

        if (!type) {
          throw new Error('type not specified');
        }

        plugins.push({
          plugin: plugin,
          type: type,
        });
      }

      /**
       * Validate and register a bpmn-js plugin.
       *
       * @param {Object} module
       *
       * @example
       *
       * import {
       *   registerBpmnJSPlugin
       * } from 'camunda-modeler-plugin-helpers';
       *
       * const BpmnJSModule = {
       *   __init__: [ 'myService' ],
       *   myService: [ 'type', ... ]
       * };
       *
       * registerBpmnJSPlugin(BpmnJSModule);
       */
      function registerBpmnJSPlugin(module) {
        registerClientPlugin(module, 'bpmn.modeler.additionalModules');
      }

      /**
       * Validate and register a bpmn-moddle extension plugin.
       *
       * @param {Object} descriptor
       *
       * @example
       * import {
       *   registerBpmnJSModdleExtension
       * } from 'camunda-modeler-plugin-helpers';
       *
       * var moddleDescriptor = {
       *   name: 'my descriptor',
       *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
       *   prefix: 'mydesc',
       *
       *   ...
       * };
       *
       * registerBpmnJSModdleExtension(moddleDescriptor);
       */
      function registerBpmnJSModdleExtension(descriptor) {
        registerClientPlugin(descriptor, 'bpmn.modeler.moddleExtension');
      }

      /**
       * Return the modeler directory, as a string.
       *
       * @deprecated Will be removed in future Camunda Modeler versions without replacement.
       *
       * @return {String}
       */
      function getModelerDirectory() {
        return window.getModelerDirectory();
      }

      /**
       * Return the modeler plugin directory, as a string.
       *
       * @deprecated Will be removed in future Camunda Modeler versions without replacement.
       *
       * @return {String}
       */
      function getPluginsDirectory() {
        return window.getPluginsDirectory();
      }

      /***/
    },

    /***/ './node_modules/domify/index.js'(
      /*!**************************************!*\
  !*** ./node_modules/domify/index.js ***!
  \**************************************/
      module
    ) {
      /**
       * Expose `parse`.
       */

      module.exports = parse;

      /**
       * Tests for browser support.
       */

      var innerHTMLBug = false;
      var bugTestDiv;
      if (typeof document !== 'undefined') {
        bugTestDiv = document.createElement('div');
        // Setup
        bugTestDiv.innerHTML =
          '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
        // Make sure that link elements get serialized correctly by innerHTML
        // This requires a wrapper element in IE
        innerHTMLBug = !bugTestDiv.getElementsByTagName('link').length;
        bugTestDiv = undefined;
      }

      /**
       * Wrap map from jquery.
       */

      var map = {
        legend: [1, '<fieldset>', '</fieldset>'],
        tr: [2, '<table><tbody>', '</tbody></table>'],
        col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
        // for script/link/style tags to work in IE6-8, you have to wrap
        // in a div with a non-whitespace character in front, ha!
        _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', ''],
      };

      map.td = map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

      map.option = map.optgroup = [
        1,
        '<select multiple="multiple">',
        '</select>',
      ];

      map.thead =
        map.tbody =
        map.colgroup =
        map.caption =
        map.tfoot =
          [1, '<table>', '</table>'];

      map.polyline =
        map.ellipse =
        map.polygon =
        map.circle =
        map.text =
        map.line =
        map.path =
        map.rect =
        map.g =
          [
            1,
            '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">',
            '</svg>',
          ];

      /**
       * Parse `html` and return a DOM Node instance, which could be a TextNode,
       * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
       * instance, depending on the contents of the `html` string.
       *
       * @param {String} html - HTML string to "domify"
       * @param {Document} doc - The `document` instance to create the Node for
       * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
       * @api private
       */

      function parse(html, doc) {
        if ('string' != typeof html) throw new TypeError('String expected');

        // default to the global `document` object
        if (!doc) doc = document;

        // tag name
        var m = /<([\w:]+)/.exec(html);
        if (!m) return doc.createTextNode(html);

        html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

        var tag = m[1];

        // body support
        if (tag == 'body') {
          var el = doc.createElement('html');
          el.innerHTML = html;
          return el.removeChild(el.lastChild);
        }

        // wrap map
        var wrap = Object.prototype.hasOwnProperty.call(map, tag)
          ? map[tag]
          : map._default;
        var depth = wrap[0];
        var prefix = wrap[1];
        var suffix = wrap[2];
        var el = doc.createElement('div');
        el.innerHTML = prefix + html + suffix;
        while (depth--) el = el.lastChild;

        // one element
        if (el.firstChild == el.lastChild) {
          return el.removeChild(el.firstChild);
        }

        // several elements
        var fragment = doc.createDocumentFragment();
        while (el.firstChild) {
          fragment.appendChild(el.removeChild(el.firstChild));
        }

        return fragment;
      }

      /***/
    },

    /******/
  };
  /************************************************************************/
  /******/ // The module cache
  /******/ var __webpack_module_cache__ = {};
  /******/
  /******/ // The require function
  /******/ function __webpack_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ var cachedModule = __webpack_module_cache__[moduleId];
    /******/ if (cachedModule !== undefined) {
      /******/ return cachedModule.exports;
      /******/
    }
    /******/ // Create a new module (and put it into the cache)
    /******/ var module = (__webpack_module_cache__[moduleId] = {
      /******/ // no module.id needed
      /******/ // no module.loaded needed
      /******/ exports: {},
      /******/
    });
    /******/
    /******/ // Execute the module function
    /******/ if (!(moduleId in __webpack_modules__)) {
      /******/ delete __webpack_module_cache__[moduleId];
      /******/ var e = new Error("Cannot find module '" + moduleId + "'");
      /******/ e.code = 'MODULE_NOT_FOUND';
      /******/ throw e;
      /******/
    }
    /******/ __webpack_modules__[moduleId](
      module,
      module.exports,
      __webpack_require__
    );
    /******/
    /******/ // Return the exports of the module
    /******/ return module.exports;
    /******/
  }
  /******/
  /************************************************************************/
  /******/ /* webpack/runtime/define property getters */
  /******/ (() => {
    /******/ // define getter functions for harmony exports
    /******/ __webpack_require__.d = (exports, definition) => {
      /******/ for (var key in definition) {
        /******/ if (
          __webpack_require__.o(definition, key) &&
          !__webpack_require__.o(exports, key)
        ) {
          /******/ Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key],
          });
          /******/
        }
        /******/
      }
      /******/
    };
    /******/
  })();
  /******/
  /******/ /* webpack/runtime/hasOwnProperty shorthand */
  /******/ (() => {
    /******/ __webpack_require__.o = (obj, prop) =>
      Object.prototype.hasOwnProperty.call(obj, prop);
    /******/
  })();
  /******/
  /******/ /* webpack/runtime/make namespace object */
  /******/ (() => {
    /******/ // define __esModule on exports
    /******/ __webpack_require__.r = (exports) => {
      /******/ if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
        /******/ Object.defineProperty(exports, Symbol.toStringTag, {
          value: 'Module',
        });
        /******/
      }
      /******/ Object.defineProperty(exports, '__esModule', { value: true });
      /******/
    };
    /******/
  })();
  /******/
  /************************************************************************/
  var __webpack_exports__ = {};
  // This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
  (() => {
    'use strict';
    /*!**************************!*\
  !*** ./client/client.js ***!
  \**************************/

    const { registerBpmnJSPlugin, registerBpmnJSModdleExtension } =
      __webpack_require__(
        /*! camunda-modeler-plugin-helpers */ './node_modules/camunda-modeler-plugin-helpers/index.js'
      );

    const AgentCreateAppendProvider = __webpack_require__(
      /*! ./provider/AgentCreateAppendProvider */ './client/provider/AgentCreateAppendProvider.js'
    );
    const AgentReplaceMenuProvider = __webpack_require__(
      /*! ./provider/AgentReplaceMenuProvider */ './client/provider/AgentReplaceMenuProvider.js'
    );
    const AgentPropertiesProvider = __webpack_require__(
      /*! ./provider/AgentPropertiesProvider */ './client/provider/AgentPropertiesProvider.js'
    );
    const AgentOverlayProvider = __webpack_require__(
      /*! ./provider/AgentOverlayProvider */ './client/provider/AgentOverlayProvider.js'
    );

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
          properties: [
            { name: 'variables', type: 'agent:Variable', isMany: true },
          ],
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
  })();

  /******/
})();
//# sourceMappingURL=client.bundle.js.map
