import {
  CheckboxEntry as DefaultCheckboxEntry,
  isCheckboxEntryEdited
} from '@bpmn-io/properties-panel';

const SUPPORTED_TRANSIENT_TYPES = new Set([
  'camunda:InputParameter',
  'camunda:OutputParameter'
]);

// groups rendered by bpmn-js-element-templates for template-bound input/output properties
const ELEMENT_TEMPLATES_IO_GROUPS = new Set([
  'ElementTemplates__Input',
  'ElementTemplates__Output'
]);

const ELEMENT_TEMPLATES_CUSTOM_PROPERTIES_GROUP = 'ElementTemplates__CustomProperties';

export default class TransientIOPlugin {
  constructor(propertiesPanel, commandStack, CheckboxEntry = DefaultCheckboxEntry) {
    this.commandStack = commandStack;
    this.CheckboxEntry = CheckboxEntry;
    propertiesPanel.registerProvider(100, this);
  }

  getGroups(element) {
    return (groups) => {
      const { inputOutput, inOutMappings } = this.getTransientCandidates(element);
      const inputParams = (inputOutput && inputOutput.inputParameters) || [];
      const outputParams = (inputOutput && inputOutput.outputParameters) || [];

      groups
        .filter(group => group.id && (
          group.id.startsWith('CamundaPlatform__') ||
          ELEMENT_TEMPLATES_IO_GROUPS.has(group.id) ||
          group.id.startsWith(ELEMENT_TEMPLATES_CUSTOM_PROPERTIES_GROUP)
        ))
        .forEach(group => {
          if (group.id.startsWith(ELEMENT_TEMPLATES_CUSTOM_PROPERTIES_GROUP)) {
            this.addTransientEntriesToCustomProperties(group, { inputParams, outputParams });
            return;
          }

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

            if (!parameter || !SUPPORTED_TRANSIENT_TYPES.has(parameter.$type)) {
              return;
            }

            this.insertTransientEntry(item, parameter);
          });
        });

      return groups;
    };
  }

  addTransientEntriesToCustomProperties(group, { inputParams, outputParams }) {
    if (!Array.isArray(group.entries)) {
      return;
    }

    group.entries.slice().forEach(entry => {
      const parameter = this.getParameterForElementTemplateProperty(entry.property, { inputParams, outputParams });

      if (!parameter || !SUPPORTED_TRANSIENT_TYPES.has(parameter.$type)) {
        return;
      }

      this.insertTransientEntryAfter(group.entries, entry, parameter);
    });
  }

  getTransientCandidates(element) {
    const bo = element.businessObject;
    const ext = bo.extensionElements;

    if (!ext || !Array.isArray(ext.values)) {
      return {
        inputOutput: null,
        inOutMappings: []
      };
    }

    return {
      inputOutput: ext.values.find(value => value.$type === 'camunda:InputOutput') || null,
      inOutMappings: ext.values.filter(value => value.$type === 'camunda:In' || value.$type === 'camunda:Out')
    };
  }

  getParameterForItem(item, { inputParams, outputParams, inOutMappings, groupId }) {
    if (groupId === 'CamundaPlatform__In' || groupId === 'CamundaPlatform__Out') {
      const anyMappingEntry = item.entries.find(entry => entry && entry.mapping);

      if (anyMappingEntry) {
        return anyMappingEntry.mapping;
      }

      return inOutMappings.find(mapping => mapping.id && mapping.id === item.id) || null;
    }

    // Element Templates render dedicated Input/Output groups; the underlying
    // camunda:InputParameter/OutputParameter (when assigned) is exposed on the
    // "local variable assignment" / "process variable assignment" entry.
    if (groupId === 'ElementTemplates__Input') {
      const entry = item.entries.find(entry => entry && entry.inputParameter);
      return entry ? entry.inputParameter : null;
    }

    if (groupId === 'ElementTemplates__Output') {
      const entry = item.entries.find(entry => entry && entry.outputParameter);
      return entry ? entry.outputParameter : null;
    }

    const entryParameter = this.getParameterFromEntries(item.entries);

    if (entryParameter) {
      return entryParameter;
    }

    if (groupId === 'CamundaPlatform__Input' || groupId === 'CamundaPlatform__Output') {
      const paramName = item.label || item.id;

      return (
        inputParams.find(parameter => parameter.name === paramName) ||
        outputParams.find(parameter => parameter.name === paramName) ||
        null
      );
    }

    return inOutMappings.find(mapping => mapping.id && mapping.id === item.id) || null;
  }

  getParameterForElementTemplateProperty(property, { inputParams, outputParams }) {
    const binding = property && property.binding;

    if (!binding) {
      return null;
    }

    if (binding.type === 'camunda:inputParameter') {
      return inputParams.find(parameter => parameter.name === binding.name) || null;
    }

    if (binding.type === 'camunda:outputParameter') {
      return outputParams.find(parameter => {
        if (parameter.value === binding.source) {
          return true;
        }

        const definition = parameter.get && parameter.get('camunda:definition');

        if (!definition || !binding.scriptFormat) {
          return false;
        }

        return (
          definition.get('camunda:scriptFormat') === binding.scriptFormat &&
          definition.get('camunda:value') === binding.source
        );
      }) || null;
    }

    return null;
  }

  getParameterFromEntries(entries) {
    const localEntry = entries.find(entry => entry && entry.id && entry.id.endsWith('-local') && entry.mapping);

    if (localEntry && localEntry.mapping) {
      return localEntry.mapping;
    }

    const parameterEntry = entries.find(entry => entry && (entry.parameter || entry.mapping));

    if (!parameterEntry) {
      return null;
    }

    return parameterEntry.parameter || parameterEntry.mapping;
  }

  insertTransientEntry(item, parameter) {
    const transientEntryId = `transient-${item.id}`;
    const hasTransientEntry = item.entries.some(entry => entry && entry.id === transientEntryId);

    if (hasTransientEntry) {
      return;
    }

    const transientEntry = {
      id: transientEntryId,
      component: this.TransientCheckbox,
      type: 'input',
      parameter,
      isEdited: isCheckboxEntryEdited
    };

    const restrictedIndex = item.entries.findIndex(entry => entry && entry.id === `restricted-${item.id}`);

    if (restrictedIndex !== -1) {
      item.entries.splice(restrictedIndex + 1, 0, transientEntry);
      return;
    }

    const localIndex = item.entries.findIndex(entry => entry && entry.id && entry.id.endsWith('-local'));

    if (localIndex !== -1) {
      item.entries.splice(localIndex + 1, 0, transientEntry);
      return;
    }

    item.entries.push(transientEntry);
  }

  insertTransientEntryAfter(entries, entry, parameter) {
    const transientEntryId = `transient-${entry.id}`;
    const hasTransientEntry = entries.some(existingEntry => existingEntry && existingEntry.id === transientEntryId);

    if (hasTransientEntry) {
      return;
    }

    const transientEntry = {
      id: transientEntryId,
      component: this.TransientCheckbox,
      type: 'input',
      parameter,
      isEdited: isCheckboxEntryEdited
    };

    const restrictedIndex = entries.findIndex(existingEntry => existingEntry && existingEntry.id === `restricted-${entry.id}`);

    if (restrictedIndex !== -1) {
      entries.splice(restrictedIndex + 1, 0, transientEntry);
      return;
    }

    const entryIndex = entries.indexOf(entry);

    if (entryIndex === -1) {
      entries.push(transientEntry);
      return;
    }

    entries.splice(entryIndex + 1, 0, transientEntry);
  }

  TransientCheckbox = (props) => {
    const { element, parameter } = props;

    return this.CheckboxEntry({
      element,
      id: 'isTransient',
      label: 'Transient',
      description: 'Select either Restricted or Transient, not both. If both are selected, Transient takes precedence.',
      getValue: () => {
        return !!parameter.get('isTransient');
      },
      setValue: (value) => {
        this.commandStack.execute('element.updateModdleProperties', {
          element,
          moddleElement: parameter,
          properties: {
            isTransient: !!value
          }
        });
      }
    });
  };
}

TransientIOPlugin.$inject = [
  'propertiesPanel',
  'commandStack'
];
