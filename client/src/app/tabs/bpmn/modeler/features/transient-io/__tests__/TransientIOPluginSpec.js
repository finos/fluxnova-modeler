import { expect } from 'chai';
import sinon from 'sinon';
import TransientIOPlugin from '../TransientIOPlugin';

const CheckboxEntryMock = sinon.stub().callsFake(props => ({ props }));

describe('TransientIOPlugin', function() {
  let propertiesPanelSpy, commandStack;

  beforeEach(function() {
    propertiesPanelSpy = { registerProvider: sinon.spy() };
    commandStack = { execute: sinon.spy() };
  });

  afterEach(function() {
    sinon.restore();
  });

  it('should register provider with propertiesPanel', function() {
    new TransientIOPlugin(propertiesPanelSpy, commandStack);

    expect(propertiesPanelSpy.registerProvider.calledOnce).to.be.true;
    expect(propertiesPanelSpy.registerProvider.firstCall.args[0]).to.equal(100);
  });

  describe('#getGroups', function() {
    let plugin, element;
    let inMapping, outMapping;

    beforeEach(function() {
      plugin = new TransientIOPlugin(propertiesPanelSpy, commandStack, CheckboxEntryMock);

      inMapping = {
        id: 'in-map-1',
        $type: 'camunda:In',
        get: sinon.stub().withArgs('isTransient').returns(false)
      };

      outMapping = {
        id: 'out-map-1',
        $type: 'camunda:Out',
        get: sinon.stub().withArgs('isTransient').returns(true)
      };

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
                    get: sinon.stub().withArgs('isTransient').returns(true)
                  }
                ],
                outputParameters: [
                  {
                    name: 'output1',
                    value: '${ result }',
                    $type: 'camunda:OutputParameter',
                    get: sinon.stub().withArgs('isTransient').returns(false)
                  }
                ]
              },
              inMapping,
              outMapping
            ]
          }
        }
      };
    });

    it('should add transient entries to Input/Output groups', function() {
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

      const resultGroups = plugin.getGroups(element)(groups);

      const inputItem = resultGroups.find(group => group.id === 'CamundaPlatform__Input').items[0];
      const outputItem = resultGroups.find(group => group.id === 'CamundaPlatform__Output').items[0];

      expect(inputItem.entries[0].id).to.equal('transient-input1');
      expect(outputItem.entries[0].id).to.equal('transient-output1');
    });

    it('should not add transient entries to In/Out mapping groups', function() {
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
                { id: 'restricted-in-map-1', mapping: inMapping },
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
      const inEntries = resultGroups[0].items[0].entries;
      const outEntries = resultGroups[1].items[0].entries;

      expect(inEntries.some(entry => entry.id === 'transient-in-map-1')).to.be.false;
      expect(outEntries.some(entry => entry.id === 'transient-out-map-1')).to.be.false;
    });

    it('should add transient entry to ElementTemplates__Input group item with an assigned inputParameter', function() {
      const templateInputParameter = {
        id: 'input1',
        $type: 'camunda:InputParameter',
        get: sinon.stub().withArgs('isTransient').returns(false)
      };

      const groups = [
        {
          id: 'ElementTemplates__Input',
          items: [
            {
              id: 'templated-item-1',
              entries: [
                { id: 'templated-item-1-description' },
                { id: 'templated-item-1-local-variable-assignment', inputParameter: templateInputParameter }
              ]
            }
          ]
        }
      ];

      const entries = plugin.getGroups(element)(groups)[0].items[0].entries;

      expect(entries.some(entry => entry.id === 'transient-templated-item-1')).to.be.true;
    });

    it('should add transient entry to ElementTemplates__Output group item with an assigned outputParameter', function() {
      const templateOutputParameter = {
        id: 'output1',
        $type: 'camunda:OutputParameter',
        get: sinon.stub().withArgs('isTransient').returns(false)
      };

      const groups = [
        {
          id: 'ElementTemplates__Output',
          items: [
            {
              id: 'templated-item-2',
              entries: [
                { id: 'templated-item-2-local-variable-assignment', outputParameter: templateOutputParameter }
              ]
            }
          ]
        }
      ];

      const entries = plugin.getGroups(element)(groups)[0].items[0].entries;

      expect(entries.some(entry => entry.id === 'transient-templated-item-2')).to.be.true;
    });

    it('should not add transient entry to ElementTemplates__Output group item without an assigned parameter', function() {
      const groups = [
        {
          id: 'ElementTemplates__Output',
          items: [
            {
              id: 'templated-item-3',
              entries: [
                { id: 'templated-item-3-local-variable-assignment', outputParameter: undefined }
              ]
            }
          ]
        }
      ];

      const entries = plugin.getGroups(element)(groups)[0].items[0].entries;

      expect(entries.some(entry => entry.id === 'transient-templated-item-3')).to.be.false;
    });

    it('should add transient entry after typed ElementTemplates__CustomProperties input entries', function() {
      const groups = [
        {
          id: 'ElementTemplates__CustomProperties',
          entries: [
            {
              id: 'custom-input',
              property: {
                type: 'String',
                binding: {
                  type: 'camunda:inputParameter',
                  name: 'input1'
                }
              }
            }
          ]
        }
      ];

      const entries = plugin.getGroups(element)(groups)[0].entries;
      const inputIndex = entries.findIndex(entry => entry.id === 'custom-input');

      expect(entries[inputIndex + 1].id).to.equal('transient-custom-input');
    });

    it('should add transient entry after restricted entry for typed custom properties', function() {
      const groups = [
        {
          id: 'ElementTemplates__CustomProperties',
          entries: [
            {
              id: 'custom-output',
              property: {
                type: 'String',
                binding: {
                  type: 'camunda:outputParameter',
                  source: '${ result }'
                }
              }
            },
            {
              id: 'restricted-custom-output'
            }
          ]
        }
      ];

      const entries = plugin.getGroups(element)(groups)[0].entries;
      const restrictedIndex = entries.findIndex(entry => entry.id === 'restricted-custom-output');

      expect(entries[restrictedIndex + 1].id).to.equal('transient-custom-output');
    });

    it('should not add transient entry to typed custom properties without a matching parameter', function() {
      const groups = [
        {
          id: 'ElementTemplates__CustomProperties',
          entries: [
            {
              id: 'missing-custom-input',
              property: {
                type: 'String',
                binding: {
                  type: 'camunda:inputParameter',
                  name: 'missingInput'
                }
              }
            }
          ]
        }
      ];

      const entries = plugin.getGroups(element)(groups)[0].entries;

      expect(entries.some(entry => entry.id === 'transient-missing-custom-input')).to.be.false;
    });
  });

  describe('TransientCheckbox', function() {
    let plugin;

    beforeEach(function() {
      plugin = new TransientIOPlugin(propertiesPanelSpy, commandStack, CheckboxEntryMock);
      CheckboxEntryMock.resetHistory();
    });

    it('should get value from isTransient property', function() {
      const parameter = {
        get: sinon.stub().withArgs('isTransient').returns(true)
      };

      plugin.TransientCheckbox({ element: {}, parameter });

      const checkboxProps = CheckboxEntryMock.firstCall.args[0];

      expect(checkboxProps.label).to.equal('Transient');
      expect(checkboxProps.description).to.equal('Select either Restricted or Transient, not both. If both are selected, Transient takes precedence.');
      expect(checkboxProps.getValue()).to.be.true;
    });

    it('should execute command on setValue(false)', function() {
      const element = { id: 'element1' };
      const parameter = {
        id: 'param1',
        get: sinon.stub()
      };

      plugin.TransientCheckbox({ element, parameter });

      const checkboxProps = CheckboxEntryMock.firstCall.args[0];
      checkboxProps.setValue(false);

      expect(commandStack.execute.calledOnce).to.be.true;
      expect(commandStack.execute.firstCall.args[0]).to.equal('element.updateModdleProperties');
      expect(commandStack.execute.firstCall.args[1].properties.isTransient).to.be.false;
    });
  });
});
