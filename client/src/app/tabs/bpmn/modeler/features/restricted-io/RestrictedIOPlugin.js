import {
  CheckboxEntry as DefaultCheckboxEntry,
  isCheckboxEntryEdited
} from '@bpmn-io/properties-panel';

const SUPPORTED_RESTRICTED_TYPES = new Set([
  'camunda:InputParameter',
  'camunda:OutputParameter',
  'camunda:In',
  'camunda:Out'
]);

export default class RestrictedIOPlugin {
  constructor(propertiesPanel, commandStack, CheckboxEntry = DefaultCheckboxEntry) {
    this.commandStack = commandStack;
    this.CheckboxEntry = CheckboxEntry;
    propertiesPanel.registerProvider(100, this);
  }

  getGroups(element) {

    return (groups) => {
      const { inputOutput, inOutMappings } = this.getRestrictedCandidates(element);
      const inputParams = (inputOutput && inputOutput.inputParameters) || [];
      const outputParams = (inputOutput && inputOutput.outputParameters) || [];

      groups
        .filter(g => g.id && g.id.startsWith('CamundaPlatform__'))
        .forEach(group => {
          (group.items || []).forEach(item => {
            if (!Array.isArray(item.entries)) {
              return;
            }

            const parameter = this.getParameterForItem(item, {
              inputParams,
              outputParams,
              inOutMappings,
              groupId: group.id
            });

            if (!parameter || !SUPPORTED_RESTRICTED_TYPES.has(parameter.$type)) {
              return;
            }

            this.insertRestrictedEntry(item, parameter);
          });
        });

      return groups;
    };
  }

  getRestrictedCandidates(element) {
    const bo = element.businessObject;
    const ext = bo.extensionElements;

    if (!ext || !Array.isArray(ext.values)) {
      return {
        inputOutput: null,
        inOutMappings: []
      };
    }

    return {
      inputOutput: ext.values.find(v => v.$type === 'camunda:InputOutput') || null,
      inOutMappings: ext.values.filter(v => v.$type === 'camunda:In' || v.$type === 'camunda:Out')
    };
  }

  getParameterForItem(item, { inputParams, outputParams, inOutMappings, groupId }) {
    if (groupId === 'CamundaPlatform__In' || groupId === 'CamundaPlatform__Out') {
      const anyMappingEntry = item.entries.find(e => e && e.mapping);
      if (anyMappingEntry) return anyMappingEntry.mapping;
      return inOutMappings.find(m => m.id && m.id === item.id) || null;
    }

    const entryParameter = this.getParameterFromEntries(item.entries);

    if (entryParameter) {
      return entryParameter;
    }

    if (groupId === 'CamundaPlatform__Input' || groupId === 'CamundaPlatform__Output') {
      const paramName = item.label || item.id;

      return (
        inputParams.find(p => p.name === paramName) ||
        outputParams.find(p => p.name === paramName) ||
        null
      );
    }

    return inOutMappings.find(mapping => mapping.id && mapping.id === item.id) || null;
  }

  getParameterFromEntries(entries) {
    const localEntry = entries.find(e => e && e.id && e.id.endsWith('-local') && e.mapping);

    if (localEntry && localEntry.mapping) {
      return localEntry.mapping;
    }

    const parameterEntry = entries.find(e => e && (e.parameter || e.mapping));

    if (!parameterEntry) {
      return null;
    }

    return parameterEntry.parameter || parameterEntry.mapping;
  }

  insertRestrictedEntry(item, parameter) {
    const restrictedEntryId = `restricted-${item.id}`;

    const hasRestrictedEntry = item.entries.some(entry => entry && entry.id === restrictedEntryId);

    if (hasRestrictedEntry) {
      return;
    }

    const restrictedEntry = {
      id: restrictedEntryId,
      component: this.RestrictedCheckbox,
      type: 'input',
      parameter,
      isEdited: isCheckboxEntryEdited
    };

    const localIndex = item.entries.findIndex(entry => entry && entry.id && entry.id.endsWith('-local'));

    if (localIndex !== -1) {
      item.entries.splice(localIndex + 1, 0, restrictedEntry);
      return;
    }

    item.entries.push(restrictedEntry);
  }

  getInputOutput(element) {
    const bo = element.businessObject;
    const ext = bo.extensionElements;
    if (!ext) return null;

    return ext.values.find(v => v.$type === 'camunda:InputOutput');
  }


  RestrictedCheckbox = (props)=> {
    const { element, parameter } = props;

    return this.CheckboxEntry({
      element,
      id: 'restricted',
      label: 'Restricted',
      getValue: () => {
        return !!parameter.get('restricted');
      },
      setValue: (value) => {
        this.commandStack.execute('element.updateModdleProperties', {
          element: element, // the task shape
          moddleElement: parameter, // the actual parameter moddle element
          properties: {
            restricted: !!value
          }
        });
      }
    });
  };
}

RestrictedIOPlugin.$inject = [
  'propertiesPanel',
  'commandStack'
];

