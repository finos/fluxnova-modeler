import { createBpmnFormGroup } from './props/BpmnFormTypeGroup';


export default class PropertiesPanelGroupsExtension {
  constructor(propertiesPanel) {
    propertiesPanel.registerProvider(100, this);
  }

  getGroups(element) {
    return groups => {

      const existingFormGroupIndex = groupExists(groups, 'CamundaPlatform__Form');

      if (existingFormGroupIndex !== -1) {
        groups.splice(existingFormGroupIndex, 1);
      }

      const extendedBpmnFormGroup = groupExists(groups, 'forms');

      groups = groups.slice();

      if (extendedBpmnFormGroup === -1) {
        const bpmnFormGroup = createBpmnFormGroup(element);
        if (bpmnFormGroup) {
          let adjacentIndex = groups.length - 2;
          groups.forEach((group, index) => {
            if (isUserAssignmentGroup(group)) {
              adjacentIndex = index + 1;
            }
          });

          groups.splice(adjacentIndex, 0, bpmnFormGroup);
        }
      }
      return groups;
    };
  }
}

PropertiesPanelGroupsExtension.$inject = [ 'propertiesPanel' ];

function isUserAssignmentGroup(group) {
  const entries = group.entries || [];
  return entries.some(
    (entry) =>
      entry?.property?.binding?.name.startsWith('camunda:user-assignment') ||
      group.id === 'CamundaPlatform__UserAssignment'
  );
}

function groupExists(groups, groupId) {
  return groups.findIndex(group => group.id === groupId);
}
