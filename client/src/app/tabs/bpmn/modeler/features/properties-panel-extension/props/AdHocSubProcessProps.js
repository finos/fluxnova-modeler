import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { isDefined } from 'min-dash';

import {
  TextFieldEntry,
  isTextFieldEntryEdited,
  CheckboxEntry,
  isCheckboxEntryEdited
} from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

import { without } from 'min-dash';


export function ActiveTasksCollectionProps(props) {
  const { element } = props;

  if (!is(element, 'bpmn:AdHocSubProcess')) {
    return [];
  }

  return [
    {
      id: 'activeTasksCollection',
      component: ActiveTasksCollection,
      isEdited: isTextFieldEntryEdited
    }
  ];
}

function ActiveTasksCollection(props) {
  const { element } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const bpmnFactory = useService('bpmnFactory');
  const debounce = useService('debounceInput');

  const businessObject = getBusinessObject(element);

  const getValue = () => {
    const property = getFluxnovaProperty(businessObject, 'activeTasksCollection');
    return property ? property.value : '';
  };

  const setValue = (value) => {
    const commands = [];

    let extensionElements = businessObject.get('extensionElements');

    // (1) ensure extension elements exist
    if (!extensionElements) {
      extensionElements = createElement(
        'bpmn:ExtensionElements',
        { values: [] },
        businessObject,
        bpmnFactory
      );

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: businessObject,
          properties: { extensionElements }
        }
      });
    }

    // (2) ensure fluxnova:Properties container exists
    let fluxnovaProperties = getExtensionElementsList(businessObject, 'fluxnova:Properties')[0];

    if (!fluxnovaProperties) {
      fluxnovaProperties = createElement(
        'fluxnova:Properties',
        { values: [] },
        extensionElements,
        bpmnFactory
      );

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [ ...extensionElements.get('values'), fluxnovaProperties ]
          }
        }
      });
    }

    // (3) ensure activeTasksCollection property exists or update it
    const activeTasksProperty = fluxnovaProperties.get('values')?.find((v) => v.name === 'activeTasksCollection');

    if (value && value.trim()) {
      if (activeTasksProperty) {

        // Update existing property
        commands.push({
          cmd: 'element.updateModdleProperties',
          context: {
            element,
            moddleElement: activeTasksProperty,
            properties: { value }
          }
        });
      } else {

        // Create new property
        const property = createElement(
          'fluxnova:Property',
          { name: 'activeTasksCollection', value },
          fluxnovaProperties,
          bpmnFactory
        );

        commands.push({
          cmd: 'element.updateModdleProperties',
          context: {
            element,
            moddleElement: fluxnovaProperties,
            properties: {
              values: [ ...(fluxnovaProperties.get('values') || []), property ]
            }
          }
        });
      }
    } else if (activeTasksProperty) {

      // Remove property if value is empty
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: fluxnovaProperties,
          properties: {
            values: without(fluxnovaProperties.get('values'), activeTasksProperty)
          }
        }
      });
    }

    // (4) commit all updates
    if (commands.length) {
      commandStack.execute('properties-panel.multi-command-executor', commands);
    }
  };

  return TextFieldEntry({
    element,
    id: 'activeTasksCollection',
    label: translate('Active Tasks Collection'),
    getValue,
    setValue,
    debounce,
    description: translate('Expression, variable reference, or comma-separated task IDs (e.g., ${taskList} or taskA,taskB)')
  });
}


export function CompletionProps(props) {
  const { element } = props;

  if (!is(element, 'bpmn:AdHocSubProcess')) {
    return [];
  }

  const entries = [
    {
      id: 'completionCondition',
      component: CompletionCondition,
      isEdited: isTextFieldEntryEdited
    },
    {
      id: 'cancelRemainingInstances',
      component: CancelRemainingInstances,
      isEdited: isCheckboxEntryEdited
    },
    {
      id: 'autoComplete',
      component: AutoComplete,
      isEdited: isCheckboxEntryEdited
    }
  ];

  return entries;
}

function CompletionCondition(props) {
  const { element } = props;

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const businessObject = getBusinessObject(element);

  const getValue = () => {
    const completionCondition = businessObject.get('completionCondition');
    return completionCondition ? completionCondition.get('body') : '';
  };

  const setValue = (value) => {
    const commands = [];

    let completionCondition = businessObject.get('completionCondition');

    if (value && value.trim()) {
      if (!completionCondition) {

        // Create the Expression element
        completionCondition = createElement(
          'bpmn:FormalExpression',
          { body: value },
          businessObject,
          bpmnFactory
        );

        commands.push({
          cmd: 'element.updateModdleProperties',
          context: {
            element,
            moddleElement: businessObject,
            properties: { completionCondition }
          }
        });
      } else {

        // Update existing Expression
        commands.push({
          cmd: 'element.updateModdleProperties',
          context: {
            element,
            moddleElement: completionCondition,
            properties: { body: value }
          }
        });
      }
    } else if (completionCondition) {

      // Remove completion condition if empty
      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: businessObject,
          properties: { completionCondition: undefined }
        }
      });
    }

    if (commands.length) {
      commandStack.execute('properties-panel.multi-command-executor', commands);
    }
  };

  return TextFieldEntry({
    element,
    id: 'completionCondition',
    label: translate('Completion Condition'),
    getValue,
    setValue,
    debounce,
    description: translate('BPMN expression for ad hoc completion (e.g., ${approved == true})')
  });
}

function CancelRemainingInstances(props) {
  const { element } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const businessObject = getBusinessObject(element);

  const getValue = () => {
    const value = businessObject.get('cancelRemainingInstances');
    return isDefined(value) ? value : true;
  };

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: businessObject,
      properties: {
        cancelRemainingInstances: value
      }
    });
  };

  return CheckboxEntry({
    element,
    id: 'cancelRemainingInstances',
    label: translate('Cancel Remaining Instances'),
    getValue,
    setValue,
    description: translate('Whether to cancel remaining active tasks when completion condition is met')
  });
}

function AutoComplete(props) {
  const { element } = props;

  const commandStack = useService('commandStack');
  const translate = useService('translate');

  const businessObject = getBusinessObject(element);

  const getValue = () => {
    const value = businessObject.get('autoComplete');
    return isDefined(value) ? value : true;
  };

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: businessObject,
      properties: {

        // default=true, persist only when false
        autoComplete: value === false ? false : undefined
      }
    });
  };

  return CheckboxEntry({
    element,
    id: 'autoComplete',
    label: translate('Auto Complete'),
    getValue,
    setValue,
    description: translate('Whether to automatically complete the ad hoc subprocess after initial activities are done')
  });
}


// helper functions

function createElement(type, properties, parent, bpmnFactory) {
  const element = bpmnFactory.create(type, properties);

  if (parent) {
    element.$parent = parent;
  }

  return element;
}

function getExtensionElementsList(businessObject, type = undefined) {
  const extensionElements = businessObject.get('extensionElements');

  if (!extensionElements) {
    return [];
  }

  const values = extensionElements.get('values');

  if (!values || !values.length) {
    return [];
  }

  if (type) {
    return values.filter(value => is(value, type));
  }

  return values;
}

function getFluxnovaProperty(businessObject, propertyName) {
  const fluxnovaProperties = getExtensionElementsList(businessObject, 'fluxnova:Properties')[0];

  if (!fluxnovaProperties) {
    return null;
  }

  const properties = fluxnovaProperties.get('values') || [];
  return properties.find((p) => p.name === propertyName);
}
