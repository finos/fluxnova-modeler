import { expect } from 'chai';
import { ActiveTasksCollectionProps, CompletionProps } from '../AdHocSubProcessProps';

describe('AdHocSubProcessProps', function() {

  describe('ActiveTasksCollectionProps', function() {

    it('should return empty array for non-AdHocSubProcess elements', function() {
      const element = {
        businessObject: {
          $type: 'bpmn:SubProcess',
          $instanceOf: (type) => type === 'bpmn:SubProcess'
        }
      };
      const props = { element };
      const result = ActiveTasksCollectionProps(props);

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should return entry array for AdHocSubProcess elements', function() {
      const element = {
        businessObject: {
          $type: 'bpmn:AdHocSubProcess',
          $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
        }
      };
      const props = { element };
      const result = ActiveTasksCollectionProps(props);

      expect(result).to.be.an('array').with.lengthOf(1);
    });

    it('should have correct entry structure', function() {
      const element = {
        businessObject: {
          $type: 'bpmn:AdHocSubProcess',
          $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
        }
      };
      const props = { element };
      const result = ActiveTasksCollectionProps(props);
      const entry = result[0];

      expect(entry).to.have.property('id', 'activeTasksCollection');
      expect(entry).to.have.property('component');
      expect(entry.component).to.be.a('function');
      expect(entry).to.have.property('isEdited');
      expect(entry.isEdited).to.be.a('function');
    });
  });

  describe('CompletionProps', function() {

    it('should return empty array for non-AdHocSubProcess elements', function() {
      const element = {
        businessObject: {
          $type: 'bpmn:SubProcess',
          $instanceOf: (type) => type === 'bpmn:SubProcess'
        }
      };
      const props = { element };
      const result = CompletionProps(props);

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should return entries array for AdHocSubProcess elements', function() {
      const element = {
        businessObject: {
          $type: 'bpmn:AdHocSubProcess',
          $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
        }
      };
      const props = { element };
      const result = CompletionProps(props);

      expect(result).to.be.an('array').with.lengthOf(3);
    });

    it('should have completionCondition entry', function() {
      const element = {
        businessObject: {
          $type: 'bpmn:AdHocSubProcess',
          $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
        }
      };
      const props = { element };
      const result = CompletionProps(props);
      const completionEntry = result.find(entry => entry.id === 'completionCondition');

      expect(completionEntry).to.exist;
      expect(completionEntry).to.have.property('component');
      expect(completionEntry.component).to.be.a('function');
      expect(completionEntry).to.have.property('isEdited');
      expect(completionEntry.isEdited).to.be.a('function');
    });

    it('should have cancelRemainingInstances entry', function() {
      const element = {
        businessObject: {
          $type: 'bpmn:AdHocSubProcess',
          $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
        }
      };
      const props = { element };
      const result = CompletionProps(props);
      const cancelEntry = result.find(entry => entry.id === 'cancelRemainingInstances');

      expect(cancelEntry).to.exist;
      expect(cancelEntry).to.have.property('component');
      expect(cancelEntry.component).to.be.a('function');
      expect(cancelEntry).to.have.property('isEdited');
      expect(cancelEntry.isEdited).to.be.a('function');
    });

    it('should have autoComplete entry', function() {
      const element = {
        businessObject: {
          $type: 'bpmn:AdHocSubProcess',
          $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
        }
      };
      const props = { element };
      const result = CompletionProps(props);
      const autoCompleteEntry = result.find(entry => entry.id === 'autoComplete');

      expect(autoCompleteEntry).to.exist;
      expect(autoCompleteEntry).to.have.property('component');
      expect(autoCompleteEntry.component).to.be.a('function');
      expect(autoCompleteEntry).to.have.property('isEdited');
      expect(autoCompleteEntry.isEdited).to.be.a('function');
    });

    it('should return entries in correct order', function() {
      const element = {
        businessObject: {
          $type: 'bpmn:AdHocSubProcess',
          $instanceOf: (type) => type === 'bpmn:AdHocSubProcess'
        }
      };
      const props = { element };
      const result = CompletionProps(props);
      const ids = result.map(entry => entry.id);

      expect(ids[0]).to.equal('completionCondition');
      expect(ids[1]).to.equal('cancelRemainingInstances');
      expect(ids[2]).to.equal('autoComplete');
    });
  });
});
