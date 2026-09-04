import { createAdHocSubProcessGroups as defaultAdHocSubProcessGroups } from './props/AdHocSubProcessGroup';


export default class AdHocSubProcessExtensionProvider {

  constructor(propertiesPanel, createAdHocSubProcessGroups = defaultAdHocSubProcessGroups) {
    propertiesPanel.registerProvider(100, this);
    this.createAdHocSubProcessGroups = createAdHocSubProcessGroups;
  }

  getGroups(element) {
    return groups => {

      const hasActiveTasksGroup = groupExists(groups, 'ad_hoc_subprocess_active_tasks') !== -1;
      const hasCompletionGroup = groupExists(groups, 'ad_hoc_subprocess_completion') !== -1;

      groups = groups.filter(group => group.id !== 'adHocCompletion');

      if (!hasActiveTasksGroup && !hasCompletionGroup) {
        const adHocSubProcessGroups = this.createAdHocSubProcessGroups(element);
        if (adHocSubProcessGroups.length) {
          let adjacentIndex = groups.length - 2;
          groups.forEach((group, index) => {
            if (isAdjacentGroup(group)) {
              adjacentIndex = index + 1;
            }
          });

          groups.splice(adjacentIndex, 0, ...adHocSubProcessGroups);
        }
      }

      return groups;
    };
  }
}

AdHocSubProcessExtensionProvider.$inject = [ 'propertiesPanel' ];

function isAdjacentGroup(group) {
  // Position after subprocess-specific groups
  const adjacentGroupIds = [
    'CamundaPlatform__Subprocess',
    'subprocess'
  ];
  return adjacentGroupIds.includes(group.id);
}

function groupExists(groups, groupId) {
  return groups.reduce((acc, group, index) => {
    return groupId === group.id ? index : acc;
  }, -1);
}
