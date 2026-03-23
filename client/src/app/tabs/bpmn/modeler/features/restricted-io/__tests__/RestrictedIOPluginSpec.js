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
    let inMapping, outMapping;

    beforeEach(function() {
      plugin = new RestrictedIOPlugin(propertiesPanelSpy, commandStack, CheckboxEntryMock);

      inMapping = {
        id: 'in-map-1',
        $type: 'camunda:In',
        get: sinon.stub().withArgs('restricted').returns(false)
      };

      outMapping = {
        id: 'out-map-1',
        $type: 'camunda:Out',
        get: sinon.stub().withArgs('restricted').returns(false)
      };

      // Mock element with camunda:InputOutput extension
      element = {
        businessObject: {
          extensionElements: {
            values: [
              {
                $type: 'camunda:InputOutput',
                inputParameters: [
                  {
                    name: 'input1',
                    $type: 'camunda:InputParameter',
                    get: sinon.stub().returns(undefined)
                  }
                ],
                outputParameters: [
                  {
                    name: 'output1',
                    $type: 'camunda:OutputParameter',
                    get: sinon.stub().returns(true)
                  }
                ],
                get: sinon.stub()
              },
              inMapping,
              outMapping
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

    it('should insert restricted directly below Local for call activity In/Out mappings', function() {
      const groups = [
        {
          id: 'CamundaPlatform__In',
          items: [
            {
              id: 'in-map-1',
              label: 'in-map-1',
              entries: [
                { id: 'in-map-1-source', parameter: inMapping },
                { id: 'in-map-1-local', mapping: inMapping },
                { id: 'in-map-1-target', parameter: inMapping }
              ]
            }
          ]
        },
        {
          id: 'CamundaPlatform__Out',
          items: [
            {
              id: 'out-map-1',
              label: 'out-map-1',
              entries: [
                { id: 'out-map-1-source', parameter: outMapping },
                { id: 'out-map-1-local', mapping: outMapping },
                { id: 'out-map-1-target', parameter: outMapping }
              ]
            }
          ]
        }
      ];

      const resultGroups = plugin.getGroups(element)(groups);

      const inEntries = resultGroups.find(g => g.id === 'CamundaPlatform__In').items[0].entries;
      const outEntries = resultGroups.find(g => g.id === 'CamundaPlatform__Out').items[0].entries;

      const inLocalIndex = inEntries.findIndex(e => e.id === 'in-map-1-local');
      const outLocalIndex = outEntries.findIndex(e => e.id === 'out-map-1-local');

      expect(inEntries[inLocalIndex + 1].id).to.equal('restricted-in-map-1');
      expect(outEntries[outLocalIndex + 1].id).to.equal('restricted-out-map-1');
    });

    it('should still add restricted entry even when Local mapping is absent on call mappings', function() {
      const groups = [
        {
          id: 'CamundaPlatform__In',
          items: [
            {
              id: 'in-map-1',
              label: 'in-map-1',
              entries: [
                { id: 'in-map-1-source', mapping: inMapping },
                { id: 'in-map-1-target', mapping: inMapping }
              ]
            }
          ]
        }
      ];

      const resultGroups = plugin.getGroups(element)(groups);
      const entries = resultGroups[0].items[0].entries;

      expect(entries.some(e => e.id === 'restricted-in-map-1')).to.be.true;
    });

    it('should not duplicate restricted entries on repeated processing', function() {
      const groups = [
        {
          id: 'CamundaPlatform__In',
          items: [
            {
              id: 'in-map-1',
              label: 'in-map-1',
              entries: [
                { id: 'in-map-1-source', parameter: inMapping },
                { id: 'in-map-1-local', mapping: inMapping },
                { id: 'in-map-1-target', parameter: inMapping }
              ]
            }
          ]
        }
      ];

      const groupModifier = plugin.getGroups(element);
      groupModifier(groups);
      groupModifier(groups);

      const entries = groups[0].items[0].entries;
      const restrictedEntries = entries.filter(e => e.id === 'restricted-in-map-1');

      expect(restrictedEntries).to.have.lengthOf(1);
    });

    it('should not modify non-CamundaPlatform groups', function() {
      const groups = [
        {
          id: 'ElementTemplates__Input',
          items: [
            {
              id: 'templated-item',
              entries: [
                { id: 'templated-item-local', mapping: inMapping }
              ]
            }
          ]
        }
      ];

      const resultGroups = plugin.getGroups(element)(groups);
      const entries = resultGroups[0].items[0].entries;

      expect(entries.some(e => e.id === 'restricted-templated-item')).to.be.false;
    });
  });

  describe('RestrictedCheckbox', function() {
    let plugin;

    beforeEach(function() {
      plugin = new RestrictedIOPlugin(propertiesPanelSpy, commandStack, CheckboxEntryMock);
      CheckboxEntryMock.resetHistory();
    });

    it('should get value from restricted property', function() {
      const parameter = {
        get: sinon.stub().withArgs('restricted').returns(true)
      };

      const props = { element: {}, parameter };
      plugin.RestrictedCheckbox(props);

      const checkboxProps = CheckboxEntryMock.firstCall.args[0];
      const value = checkboxProps.getValue();
      expect(value).to.be.true;
    });

    it('should return false when restricted property is false', function() {
      const parameter = {
        get: sinon.stub().withArgs('restricted').returns(false)
      };

      const props = { element: {}, parameter };
      plugin.RestrictedCheckbox(props);

      const checkboxProps = CheckboxEntryMock.firstCall.args[0];
      const value = checkboxProps.getValue();
      expect(value).to.be.false;
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
      expect(commandStack.execute.firstCall.args[1].properties.restricted).to.be.true;
      expect(commandStack.execute.firstCall.args[1].properties).to.not.have.property('restrictionTag');
    });

    it('should execute command with false on setValue(false)', function() {
      const element = { id: 'element1' };
      const parameter = {
        id: 'param1',
        get: sinon.stub()
      };
      const props = { element, parameter };

      plugin.RestrictedCheckbox(props);
      const checkboxProps = CheckboxEntryMock.firstCall.args[0];
      checkboxProps.setValue(false);

      expect(commandStack.execute.firstCall.args[1].properties.restricted).to.be.false;
      expect(commandStack.execute.firstCall.args[1].properties).to.not.have.property('restrictionTag');
    });
  });
});
