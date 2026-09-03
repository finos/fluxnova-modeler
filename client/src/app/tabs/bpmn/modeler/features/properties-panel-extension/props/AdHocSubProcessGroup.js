import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  ActiveTasksCollectionProps,
  CompletionProps
} from './AdHocSubProcessProps';


export function createAdHocSubProcessGroups(element) {
  if (!is(element, 'bpmn:AdHocSubProcess')) {
    return [];
  }

  const activeTasksGroup = {
    id: 'ad_hoc_subprocess_active_tasks',
    label: 'Active Tasks',
    entries: [
      ...ActiveTasksCollectionProps({ element })
    ]
  };

  const completionGroup = {
    id: 'ad_hoc_subprocess_completion',
    label: 'Completion',
    entries: [
      ...CompletionProps({ element })
    ]
  };

  return [ activeTasksGroup, completionGroup ];
}
