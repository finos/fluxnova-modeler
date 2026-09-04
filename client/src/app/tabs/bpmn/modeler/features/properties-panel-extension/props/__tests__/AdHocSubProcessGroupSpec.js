import { expect } from 'chai';
import { createAdHocSubProcessGroups } from '../AdHocSubProcessGroup';

describe('AdHocSubProcessGroup', function() {

  it('should return array with two groups when element is AdHocSubProcess', function() {

    const element = {
      businessObject: {
        $type: 'bpmn:AdHocSubProcess',
        $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
      }
    };

    const groups = createAdHocSubProcessGroups(element);

    expect(groups).to.be.an('array').with.lengthOf(2);
    expect(groups[0].id).to.equal('ad_hoc_subprocess_active_tasks');
    expect(groups[1].id).to.equal('ad_hoc_subprocess_completion');
  });

  it('should return empty array when element is not AdHocSubProcess', function() {

    const element = {
      businessObject: {
        $type: 'bpmn:SubProcess',
        $instanceOf: (type) => type === 'bpmn:SubProcess'
      }
    };

    const groups = createAdHocSubProcessGroups(element);

    expect(groups).to.be.an('array').that.is.empty;
  });

  it('should have correct Active Tasks group properties', function() {

    const element = {
      businessObject: {
        $type: 'bpmn:AdHocSubProcess',
        $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
      }
    };

    const groups = createAdHocSubProcessGroups(element);
    const activeTasksGroup = groups[0];

    expect(activeTasksGroup).to.have.property('id', 'ad_hoc_subprocess_active_tasks');
    expect(activeTasksGroup).to.have.property('label', 'Active Tasks');
    expect(activeTasksGroup).to.have.property('entries');
    expect(activeTasksGroup.entries).to.be.an('array').with.length.greaterThan(0);
  });

  it('should have correct Completion group properties', function() {

    const element = {
      businessObject: {
        $type: 'bpmn:AdHocSubProcess',
        $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
      }
    };

    const groups = createAdHocSubProcessGroups(element);
    const completionGroup = groups[1];

    expect(completionGroup).to.have.property('id', 'ad_hoc_subprocess_completion');
    expect(completionGroup).to.have.property('label', 'Completion');
    expect(completionGroup).to.have.property('entries');
    expect(completionGroup.entries).to.be.an('array').with.length.greaterThan(0);
  });

  it('should have activeTasksCollection entry in Active Tasks group', function() {

    const element = {
      businessObject: {
        $type: 'bpmn:AdHocSubProcess',
        $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
      }
    };

    const groups = createAdHocSubProcessGroups(element);
    const activeTasksGroup = groups[0];
    const hasActiveTasksEntry = activeTasksGroup.entries.some(entry => entry.id === 'activeTasksCollection');

    expect(hasActiveTasksEntry).to.be.true;
  });

  it('should have completionCondition, cancelRemainingInstances and autoComplete in Completion group', function() {

    const element = {
      businessObject: {
        $type: 'bpmn:AdHocSubProcess',
        $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
      }
    };

    const groups = createAdHocSubProcessGroups(element);
    const completionGroup = groups[1];
    const entryIds = completionGroup.entries.map(entry => entry.id);

    expect(entryIds).to.include('completionCondition');
    expect(entryIds).to.include('cancelRemainingInstances');
    expect(entryIds).to.include('autoComplete');
  });
});
