import { Group } from '@bpmn-io/properties-panel';
import { JobExecutionProps } from './JobExecutionProps';
import translate from 'diagram-js/lib/i18n/translate/translate';


export function createJobExecutionGroup(element) {

  const group = {
    id: 'job_execution',
    label: translate('Job execution'),
    component: Group,
    entries: [
      ...JobExecutionProps({ element })
    ]
  };

  if (group.entries.length) {
    return group;
  }

  return null;
}
