import { createJobExecutionGroup as defaultCreateJobExecutionGroup } from './props/JobExecutionGroup';


export default class JobExecutionExtensionProvider {

  constructor(propertiesPanel, createJobExecutionGroup = defaultCreateJobExecutionGroup) {
    propertiesPanel.registerProvider(100, this);
    this.createJobExecutionGroup = createJobExecutionGroup;
  }

  getGroups(element) {
    return groups => {

      const existingJobExecutionGroupIndex = groupExists(groups, 'CamundaPlatform__JobExecution');

      if (existingJobExecutionGroupIndex !== -1) {
        groups.splice(existingJobExecutionGroupIndex, 1);
      }

      const extendedJobExecutionGroup = groupExists(groups, 'job_execution');

      groups = groups.slice();

      if (extendedJobExecutionGroup === -1) {
        const jobExecutionGroup = this.createJobExecutionGroup(element);
        if (jobExecutionGroup) {
          let adjacentIndex = groups.length - 2;
          groups.forEach((group, index) => {
            if (isAdjacentGroup(group)) {
              adjacentIndex = index + 1;
            }
          });

          groups.splice(adjacentIndex, 0, jobExecutionGroup);
        }
      }

      return groups;
    };
  }
}

 JobExecutionExtensionProvider.$inject = [ 'propertiesPanel' ];

function isAdjacentGroup(group) {
  const entries = group.entries;
  let isAdjacent = false;
  if (entries) {
    entries.forEach(entry => {
      const property = entry.property;
      if (property) {
        const propertyName = property.binding.name;
        if (propertyName.startsWith('camunda:async')) {
          return isAdjacent = true;
        }
      }
    });
  }
  if ('CamundaPlatform__AsynchronousContinuations' === group.id) {
    isAdjacent = true;
  }
  return isAdjacent;
}

function groupExists(groups, groupId) {
  return groups.reduce((acc, group, index) => {
    return groupId === group.id ? index : acc;
  }, -1);
}
