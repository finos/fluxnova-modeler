import { expect } from 'chai';
import sinon from 'sinon';
import RestrictedIOPlugin from '../RestrictedIOPlugin';

// Mock CheckboxEntry because it's a Preact component using hooks
// which doesn't work in this simple unit test environment.
const CheckboxEntryMock = sinon.stub().callsFake(props => ({ props }));

describe('RestrictedIOPlugin', function() {
  let propertiesPanelSpy, commandStack;

  beforeEach(function() {
    propertiesPanelSpy = { registerProvider: sinon.spy() };
    commandStack = { execute: sinon.spy() };
  });

  afterEach(function() {
    sinon.restore();
  });

  it('should register provider with propertiesPanel', function() {
    new RestrictedIOPlugin(propertiesPanelSpy, commandStack);

    expect(propertiesPanelSpy.registerProvider.calledOnce).to.be.true;
    expect(propertiesPanelSpy.registerProvider.firstCall.args[0]).to.equal(100);
  });

  describe('#getGroups', function() {
    let plugin, element;

    beforeEach(function() {
      plugin = new RestrictedIOPlugin(propertiesPanelSpy, commandStack, CheckboxEntryMock);

      // Mock element with camunda:InputOutput extension
      element = {
        businessObject: {
          extensionElements: {
            values: [
              {
                $type: 'camunda:InputOutput',
                inputParameters: [
                  { name: 'input1', get: sinon.stub().returns(undefined) }
                ],
                outputParameters: [
                  { name: 'output1', get: sinon.stub().returns('restricted') }
                ]
              }
            ]
          }
        }
      };
    });

    it('should return a function that modifies groups', function() {
      const groupModifier = plugin.getGroups(element);
      expect(groupModifier).to.be.a('function');
    });

    it('should add restricted entries to Input/Output groups', function() {
      const groups = [
        {
          id: 'CamundaPlatform__Input',
          items: [
            { id: 'input1', label: 'input1', entries: [] }
          ]
        },
        {
          id: 'CamundaPlatform__Output',
          items: [
            { id: 'output1', label: 'output1', entries: [] }
          ]
        }
      ];

      const groupModifier = plugin.getGroups(element);
      const resultGroups = groupModifier(groups);

      const inputItem = resultGroups.find(g => g.id === 'CamundaPlatform__Input').items[0];
      const outputItem = resultGroups.find(g => g.id === 'CamundaPlatform__Output').items[0];

      expect(inputItem.entries).to.have.lengthOf(1);
      expect(inputItem.entries[0].id).to.equal('restricted-input1');
      expect(outputItem.entries[0].id).to.equal('restricted-output1');
    });
  });

  describe('RestrictedCheckbox', function() {
    let plugin;

    beforeEach(function() {
      plugin = new RestrictedIOPlugin(propertiesPanelSpy, commandStack, CheckboxEntryMock);
      CheckboxEntryMock.resetHistory();
    });

    it('should get value from restrictionTag property', function() {
      const parameter = {
        get: sinon.stub().withArgs('restrictionTag').returns('restricted')
      };

      const props = { element: {}, parameter };
      plugin.RestrictedCheckbox(props);

      const checkboxProps = CheckboxEntryMock.firstCall.args[0];
      const value = checkboxProps.getValue();
      expect(value).to.be.true;
    });

    it('should execute command on setValue(true)', function() {
      const element = { id: 'element1' };
      const parameter = {
        id: 'param1',
        get: sinon.stub()
      };
      const props = { element, parameter };

      plugin.RestrictedCheckbox(props);
      const checkboxProps = CheckboxEntryMock.firstCall.args[0];
      checkboxProps.setValue(true);

      expect(commandStack.execute.calledOnce).to.be.true;
      expect(commandStack.execute.firstCall.args[0]).to.equal('element.updateModdleProperties');
      expect(commandStack.execute.firstCall.args[1].properties.restrictionTag).to.equal('restricted');
    });

    it('should execute command with undefined on setValue(false)', function() {
      const element = { id: 'element1' };
      const parameter = {
        id: 'param1',
        get: sinon.stub()
      };
      const props = { element, parameter };

      plugin.RestrictedCheckbox(props);
      const checkboxProps = CheckboxEntryMock.firstCall.args[0];
      checkboxProps.setValue(false);

      expect(commandStack.execute.firstCall.args[1].properties.restrictionTag).to.be.undefined;
    });
  });
});
