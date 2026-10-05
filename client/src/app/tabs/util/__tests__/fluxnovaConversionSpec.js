/* global sinon */

import {
  convertBpmnToFluxnovaIfRequired,
  convertDmnToFluxnovaIfRequired, convertFormToFluxnovaIfRequired,
} from '../fluxnovaConversion';
import { spy } from 'sinon';
import { ENGINES, getLatestStable } from '../../../../util/Engines';

describe('tabs/bpmn/util - fluxnovaConversion', function() {

  const camundaNsBpmn = `
    <?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1ug79wa" targetNamespace="http://bpmn.io/schema/bpmn" xmlns:modeler="http://camunda.org/schema/modeler/1.0" exporter="Camunda Modeler" exporterVersion="5.33.0-dev" modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="1.0.0">
      <bpmn:process id="Process_10ga7ii" isExecutable="true" >
        <bpmn:startEvent id="StartEvent_1" />
      </bpmn:process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_10ga7ii">
          <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
            <dc:Bounds x="182" y="162" width="36" height="36" />
          </bpmndi:BPMNShape>
        </bpmndi:BPMNPlane>
      </bpmndi:BPMNDiagram>
    </bpmn:definitions>
  `;

  const camundaNsRestrictedTransientBpmn = `
    <?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" id="Definitions_1ug79wa" targetNamespace="http://bpmn.io/schema/bpmn" xmlns:modeler="http://camunda.org/schema/modeler/1.0" exporter="Camunda Modeler" exporterVersion="5.33.0-dev" modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="1.0.0">
      <bpmn:process id="Process_10ga7ii" isExecutable="true">
        <bpmn:serviceTask id="Activity_1">
          <bpmn:extensionElements>
            <camunda:inputOutput>
              <camunda:inputParameter name="Input_1" camunda:isTransient="true" restricted="true" />
              <camunda:outputParameter name="Output_1" isTransient="false" restricted="false" />
            </camunda:inputOutput>
          </bpmn:extensionElements>
        </bpmn:serviceTask>
      </bpmn:process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_10ga7ii" />
      </bpmndi:BPMNDiagram>
    </bpmn:definitions>
  `;

  const camunda8Bpmn = `
    <?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1ug79wa" targetNamespace="http://bpmn.io/schema/bpmn" xmlns:modeler="http://camunda.org/schema/modeler/1.0" exporter="Camunda Modeler" exporterVersion="5.33.0-dev" modeler:executionPlatform="Camunda Cloud" modeler:executionPlatformVersion="1.0.0">
      <bpmn:process id="Process_10ga7ii" isExecutable="true" >
        <bpmn:startEvent id="StartEvent_1" />
      </bpmn:process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_10ga7ii">
          <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
            <dc:Bounds x="182" y="162" width="36" height="36" />
          </bpmndi:BPMNShape>
        </bpmndi:BPMNPlane>
      </bpmndi:BPMNDiagram>
    </bpmn:definitions>
  `;

  const fluxnovaBpmn = `
    <?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:fluxnova="http://fluxnova.finos.org/schema/1.0/bpmn" id="Definitions_1ug79wa" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Fluxnova Modeler" exporterVersion="5.33.0-dev" xmlns:modeler="http://fluxnova.finos.org/schema/modeler/1.0" modeler:executionPlatform="Fluxnova Platform" modeler:executionPlatformVersion="1.0.0">
        <bpmn:process id="Process_10ga7ii" isExecutable="true" >
        <bpmn:startEvent id="StartEvent_1" />
        </bpmn:process>
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_10ga7ii">
          <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
            <dc:Bounds x="182" y="162" width="36" height="36" />
          </bpmndi:BPMNShape>
        </bpmndi:BPMNPlane>
      </bpmndi:BPMNDiagram>
    </bpmn:definitions>
  `;

  const camundaDmn = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="https://www.omg.org/spec/DMN/20191111/MODEL/" xmlns:dmndi="https://www.omg.org/spec/DMN/20191111/DMNDI/" xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/" id="Definitions_1x2v1az" name="DRD" namespace="http://camunda.org/schema/1.0/dmn" xmlns:modeler="http://camunda.org/schema/modeler/1.0" exporter="Camunda Modeler" exporterVersion="5.33.0-dev" modeler:executionPlatform="Camunda Platform" modeler:executionPlatformVersion="1.0.0">
      <decision id="Decision_0lhr2pc" name="Decision 1">
        <decisionTable id="DecisionTable_0ym4gfa">
          <input id="Input_1">
            <inputExpression id="InputExpression_1" typeRef="string">
              <text></text>
            </inputExpression>
          </input>
          <output id="Output_1" typeRef="string" />
        </decisionTable>
      </decision>
      <dmndi:DMNDI>
        <dmndi:DMNDiagram>
          <dmndi:DMNShape dmnElementRef="Decision_0lhr2pc">
            <dc:Bounds height="80" width="180" x="160" y="100" />
          </dmndi:DMNShape>
        </dmndi:DMNDiagram>
      </dmndi:DMNDI>
    </definitions>
  `;

  const camundaForm = {
    type: 'default',
    id: 'Form_0lvnpjd',
    exporter: {
      name: 'Camunda Modeler',
      version: '5.33.0-dev'
    },
    components: [],
    executionPlatform: 'Camunda Platform',
    executionPlatformVersion: '1.0.0'
  };

  const camunda8Form = {
    type: 'default',
    id: 'Form_0lvnpjd',
    exporter: {
      name: 'Camunda Modeler',
      version: '5.33.0-dev'
    },
    components: [],
    executionPlatform: 'Camunda Cloud',
    executionPlatformVersion: '1.0.0'
  };

  const fluxnovaForm = {
    type: 'default',
    id: 'Form_0lvnpjd',
    exporter: {
      name: 'Fluxnova Modeler',
      version: '5.33.0-dev'
    },
    components: [],
    executionPlatform: 'Fluxnova Platform',
    executionPlatformVersion: '1.0.0'
  };

  describe('convertBpmnToFluxnovaIfRequired', function() {

    let onAction;
    let onContentChanged;

    beforeEach(function() {
      onContentChanged = spy();
      onAction = sinon.stub().resolves({
        button: '0'
      });
    });

    describe('should convert', function() {

      const latestStable = getLatestStable(ENGINES.FLUXNOVA);

      it('non fluxnova bpmn', async function() {

        const conversion = await convertBpmnToFluxnovaIfRequired(camundaNsBpmn, onAction, onContentChanged);

        expect(onAction).to.have.been.calledWith('show-dialog');

        expect(conversion).to.contain('xmlns:modeler="http://fluxnova.finos.org/schema/modeler/1.0"');
        expect(conversion).to.contain('xmlns:fluxnova="http://fluxnova.finos.org/schema/1.0/bpmn"');
        expect(conversion).to.contain('modeler:executionPlatform="Fluxnova Platform"');
        expect(conversion).to.contain(`modeler:executionPlatformVersion="${latestStable}"`);

        expect(conversion).not.to.contain('xmlns:modeler="http://camunda.org/schema/modeler/1.0"');
        expect(conversion).not.to.contain('modeler:executionPlatform="Camunda Platform"');

        expect(onAction).not.to.have.been.calledWith('close-tab');
        expect(onContentChanged).to.have.been.called;

      });

      it('non fluxnova bpmn with restricted and transient attributes', async function() {

        const conversion = await convertBpmnToFluxnovaIfRequired(camundaNsRestrictedTransientBpmn, onAction, onContentChanged);

        expect(onAction).to.have.been.calledWith('show-dialog');
        expect(conversion).to.contain('restricted="true"');
        expect(conversion).to.contain('restricted="false"');
        expect(conversion).to.contain('isTransient="true"');
        expect(conversion).to.contain('isTransient="false"');
        expect(onContentChanged).to.have.been.called;

      });

      it('non fluxnova dmn', async function() {

        const conversion = await convertDmnToFluxnovaIfRequired(camundaDmn, onAction, onContentChanged);

        expect(onAction).to.have.been.calledWith('show-dialog');

        expect(conversion).to.contain('namespace="http://fluxnova.finos.org/schema/1.0/dmn"');
        expect(conversion).to.contain('modeler:executionPlatform="Fluxnova Platform"');
        expect(conversion).to.contain(`modeler:executionPlatformVersion="${latestStable}"`);

        expect(conversion).not.to.contain('namespace="http://camunda.org/schema/1.0/dmn"');
        expect(conversion).not.to.contain('modeler:executionPlatform="Camunda Platform"');

        expect(onAction).not.to.have.been.calledWith('close-tab');
        expect(onContentChanged).to.have.been.called;

      });

      it('non fluxnova form', async function() {

        const conversion = await convertFormToFluxnovaIfRequired(camundaForm, onAction);

        expect(onAction).to.have.been.calledWith('show-dialog');

        expect(conversion.executionPlatform).to.be.eql('Fluxnova Platform');
        expect(conversion.executionPlatformVersion).to.be.eql(latestStable);

        expect(onAction).not.to.have.been.calledWith('close-tab');
        expect(onContentChanged).not.to.have.been.called;

      });

    });

    describe('should not convert', function() {

      it('when model not converted', async function() {

        let onContentChanged = spy();

        onAction = sinon.stub().resolves({
          button: '1'
        });

        await convertBpmnToFluxnovaIfRequired(camundaNsBpmn, onAction, onContentChanged);

        expect(onAction).to.have.been.calledWith('close-tab');
        expect(onContentChanged).not.to.have.been.called;

      });

      it('when c8 xml detected', async function() {

        let onContentChanged = spy();

        onAction = sinon.stub().resolves({
          button: '2'
        });

        await convertBpmnToFluxnovaIfRequired(camunda8Bpmn, onAction, onContentChanged);

        expect(onAction).to.have.been.calledWith('close-tab');
        expect(onContentChanged).not.to.have.been.called;

      });

      it('when c8 form detected', async function() {

        onAction = sinon.stub().resolves({
          button: '2'
        });

        await convertFormToFluxnovaIfRequired(camunda8Form, onAction);

        expect(onAction).to.have.been.calledWith('close-tab');
      });

      it('when xml contains both fluxnova ns and exe platform', async function() {

        let onContentChanged = spy();

        await convertBpmnToFluxnovaIfRequired(fluxnovaBpmn, onAction, onContentChanged);

        expect(onAction).not.to.have.been.calledWith('show-dialog');
        expect(onContentChanged).not.to.have.been.called;

      });

      it('when xml entity invalid', async function() {

        let onContentChanged = spy();

        await convertBpmnToFluxnovaIfRequired('some-entity', onAction, onContentChanged);

        expect(onAction).not.to.have.been.calledWith('show-dialog');
        expect(onContentChanged).not.to.have.been.called;

      });

      it('when json contains both fluxnova ns and exe platform', async function() {

        await convertFormToFluxnovaIfRequired(fluxnovaForm, onAction);

        expect(onAction).not.to.have.been.calledWith('show-dialog');

      });

      it('when json entity invalid', async function() {

        await convertFormToFluxnovaIfRequired('some-entity', onAction);

        expect(onAction).not.to.have.been.calledWith('show-dialog');
      });

    });

  });

});
