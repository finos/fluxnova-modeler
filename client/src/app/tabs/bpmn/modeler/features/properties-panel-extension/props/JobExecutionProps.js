import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';

import {
  useService
} from 'bpmn-js-properties-panel';
import { isAsync, isTimerEvent } from '../utils/Helpers';


export function JobExecutionProps(props) {
  const {
    element
  } = props;

  const businessObject = getBusinessObject(element);

  const entries = [];

  // (1) add retryTimeCycle field for camunda:asyncCapable enabled Elements
  // or TimerEvents
  if ((is(element, 'camunda:AsyncCapable') && isAsync(businessObject)) ||
    isTimerEvent(element)) {
    entries.push({
      id: 'retryTimeCycle',
      component: RetryTimeCycle,
      isEdited: isTextFieldEntryEdited
    });
  }

  // (2) add jobPriority field for camunda:jobPriorized with async enabled
  //  or Processes
  //  or Processes referred to by participants
  //  or TimerEvents
  if ((is(element, 'camunda:JobPriorized') && isAsync(businessObject)) ||
    is(element, 'bpmn:Process') ||
    (is(element, 'bpmn:Participant') && businessObject.get('processRef')) ||
    isTimerEvent(element)) {
    entries.push({
      id: 'jobPriority',
      component: JobPriority,
      isEdited: isTextFieldEntryEdited
    });
  }

  return entries;
}

export function JobPriority(props) {
  const { element } = props;

  const commandStack = useService('commandStack'),
        translate = useService('translate'),
        debounce = useService('debounceInput');

  const businessObject = is(element, 'bpmn:Participant') ?
    getBusinessObject(element).get('processRef') :
    getBusinessObject(element);

  const getValue = () => {
    return businessObject.get('camunda:jobPriority');
  };

  const setValue = (value) => {
    commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: businessObject,
      properties: {
        'camunda:jobPriority': value
      }
    });
  };

  return TextFieldEntry({
    element,
    id: 'jobPriority',
    label: translate('Priority'),
    getValue,
    setValue,
    debounce
  });
}

export function RetryTimeCycle(props) {
  const { element } = props;

  const bpmnFactory = useService('bpmnFactory'),
        commandStack = useService('commandStack'),
        translate = useService('translate'),
        debounce = useService('debounceInput');

  const businessObject = getBusinessObject(element);

  const getValue = () => {
    const failedJobRetryTimeCycle = getExtensionElementsList(businessObject, 'camunda:FailedJobRetryTimeCycle')[0];
    return failedJobRetryTimeCycle && failedJobRetryTimeCycle.body;
  };

  const setValue = (value) => {
    const commands = [];

    let extensionElements = businessObject.get('extensionElements');

    // (1) ensure extension elements
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

    // (2) ensure failedJobRetryTimeCycle
    let failedJobRetryTimeCycle = getExtensionElementsList(businessObject, 'camunda:FailedJobRetryTimeCycle')[0];

    if (!failedJobRetryTimeCycle) {
      failedJobRetryTimeCycle = createElement(
        'camunda:FailedJobRetryTimeCycle',
        { },
        extensionElements,
        bpmnFactory
      );

      commands.push({
        cmd: 'element.updateModdleProperties',
        context: {
          element,
          moddleElement: extensionElements,
          properties: {
            values: [ ...extensionElements.get('values'), failedJobRetryTimeCycle ]
          }
        }
      });
    }

    // (3) update failedJobRetryTimeCycle value
    commands.push({
      cmd: 'element.updateModdleProperties',
      context: {
        element,
        moddleElement: failedJobRetryTimeCycle,
        properties: {
          body: value
        }
      }
    });

    // (4) commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };

  return TextFieldEntry({
    element,
    id: 'retryTimeCycle',
    label: translate('Retry time cycle'),
    getValue,
    setValue,
    debounce
  });
}


// helper //////////////////

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
