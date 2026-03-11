import { CheckboxEntry as DefaultCheckboxEntry, isEdited } from '@bpmn-io/properties-panel';

export default class RestrictedIOPlugin {
  constructor(propertiesPanel, commandStack, CheckboxEntry = DefaultCheckboxEntry) {
    this.commandStack = commandStack;
    this.CheckboxEntry = CheckboxEntry;
    propertiesPanel.registerProvider(100, this);
  }

  getGroups(element) {

    return (groups) => {

      const io = this.getInputOutput(element);
      if (!io) return groups;

      const inputParams = io.inputParameters || [];
      const outputParams = io.outputParameters || [];

      // Find existing input/output group
      const ioGroups = groups.filter(g => g.id === 'CamundaPlatform__Input' || g.id === 'CamundaPlatform__Output');

      // Add checkbox entry to the existing group
      ioGroups.forEach(ioGroup => {

        ioGroup.items.forEach(item => {

          // Add Restricted checkbox to each item
          const paramName = item.label || item.id;

          const param =
            inputParams.find(p => p.name === paramName) ||
            outputParams.find(p => p.name === paramName);

          if (!param) return;

          item.entries.push({
            id: `restricted-${item.id}`,
            component: this.RestrictedCheckbox,
            type: 'input',
            parameter: param,
            isEdited: function isEdited(node) {
              return node && !!node.value;
            }

          });

        });
      });

      return groups;
    };
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
        const restrictionTag = parameter.get('restrictionTag');
        return restrictionTag === 'restricted';
      },
      setValue: (value) => {
        this.commandStack.execute('element.updateModdleProperties', {
          element: element, // the task shape
          moddleElement: parameter, // the actual parameter moddle element
          properties: {
            restrictionTag: value ? 'restricted' : undefined
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

