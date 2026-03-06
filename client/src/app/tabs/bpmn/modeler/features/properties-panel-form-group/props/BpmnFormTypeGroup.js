import { Group } from '@bpmn-io/properties-panel';
import { FormProps } from './BpmnFormProps';
import translate from 'diagram-js/lib/i18n/translate/translate';


export function createBpmnFormGroup(element) {

  const group = {
    label: translate('Forms'),
    id: 'FluxnovaPlatform__Form',
    component: Group,
    entries: [
      ...FormProps({ element })
    ]
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}
