/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import TestContainer from 'mocha-test-container-support';

import BpmnModeler from '../../../src/app/tabs/bpmn/modeler/BpmnModeler';

import diagramXML from './diagram.bpmn';

import Flags, { ENABLE_NEW_CONTEXT_PAD } from '../../../src/util/Flags';

const DEFAULT_OPTIONS = {
  exporter: {
    name: 'my-tool',
    version: '120-beta.100'
  }
};

const CAMUNDA_TRANSIENT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
    <bpmn:serviceTask id="Activity_1">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="requiredInput" camunda:isTransient="true">demo</camunda:inputParameter>
          <camunda:outputParameter name="result" camunda:isTransient="false">value</camunda:outputParameter>
        </camunda:inputOutput>
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    <bpmn:callActivity id="CallActivity_1" calledElement="Called_Process">
      <bpmn:extensionElements>
        <camunda:in source="sourceVar" target="targetVar" camunda:isTransient="true" />
        <camunda:out source="resultVar" target="outerVar" camunda:isTransient="false" />
      </bpmn:extensionElements>
    </bpmn:callActivity>
    <bpmn:endEvent id="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Activity_1" targetRef="CallActivity_1" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="CallActivity_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_1_di" bpmnElement="Activity_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="CallActivity_1_di" bpmnElement="CallActivity_1">
        <dc:Bounds x="390" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="552" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="390" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="490" y="120" />
        <di:waypoint x="552" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const PLAIN_TRANSIENT_XML = CAMUNDA_TRANSIENT_XML
  .replaceAll(' camunda:isTransient=', ' isTransient=');

const MIXED_TRANSIENT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
    <bpmn:serviceTask id="Activity_1">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="requiredInput" camunda:isTransient="true">demo</camunda:inputParameter>
          <camunda:outputParameter name="result" isTransient="false">value</camunda:outputParameter>
        </camunda:inputOutput>
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    <bpmn:endEvent id="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Activity_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_1_di" bpmnElement="Activity_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="402" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="402" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const RESTRICTED_TRANSIENT_SELF_CLOSING_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:serviceTask id="Activity_1">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="Input_1bncvr9" camunda:isTransient="true" restricted="true" />
          <camunda:outputParameter name="Output_1bncvr9" isTransient="false" restricted="false" />
        </camunda:inputOutput>
      </bpmn:extensionElements>
    </bpmn:serviceTask>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;


inlineCSS(require('camunda-bpmn-js/dist/assets/camunda-platform-modeler.css'));

inlineCSS(`
  .test-content-container {
    display: flex;
    flex-direction: row;
  }

  .modeler-container {
    height: 100%;
  }
`);


describe('BpmnModeler', function() {

  this.timeout(10000);

  let modelerContainer;

  beforeEach(function() {
    modelerContainer = document.createElement('div');
    modelerContainer.classList.add('modeler-container');

    const container = TestContainer.get(this);

    container.appendChild(modelerContainer);
  });


  it('should bootstrap', async function() {

    // when
    const modeler = await createModeler({
      container: modelerContainer
    });

    // then
    expect(modeler).to.exist;
  });


  it('should support camunda:isTransient on parameters but not In/Out mappings', async function() {

    // given
    const modeler = new BpmnModeler({
      ...DEFAULT_OPTIONS,
      container: modelerContainer
    });

    // when
    const { warnings } = await modeler.importXML(CAMUNDA_TRANSIENT_XML);
    const definitions = modeler.getDefinitions();
    const serviceTask = definitions.rootElements[0].flowElements.find((element) => element.$type === 'bpmn:ServiceTask');
    const inputOutput = serviceTask.extensionElements.values[0];
    const callActivity = definitions.rootElements[0].flowElements.find((element) => element.$type === 'bpmn:CallActivity');
    const inMapping = callActivity.extensionElements.values.find((value) => value.$type === 'camunda:In');
    const outMapping = callActivity.extensionElements.values.find((value) => value.$type === 'camunda:Out');

    // then
    expect(warnings).to.have.lengthOf(2);
    expect(inputOutput.inputParameters[0].get('isTransient')).to.equal(true);
    expect(inputOutput.outputParameters[0].get('isTransient')).to.equal(false);
    expect(inMapping.get('isTransient')).to.be.undefined;
    expect(outMapping.get('isTransient')).to.be.undefined;
  });


  it('should preserve camunda:isTransient when saving XML', async function() {

    // given
    const modeler = new BpmnModeler({
      ...DEFAULT_OPTIONS,
      container: modelerContainer
    });

    // when
    await modeler.importXML(CAMUNDA_TRANSIENT_XML);
    const { xml } = await modeler.saveXML({ format: true });

    // then
    expect(xml).to.contain('camunda:inputParameter');
    expect(xml).to.contain('camunda:outputParameter');
    expect(xml).to.contain('camunda:in');
    expect(xml).to.contain('camunda:out');
    expect(xml).to.contain('camunda:isTransient="true"');
    expect(xml).to.contain('camunda:isTransient="false"');
    expect(xml).to.not.contain('fluxnova:isTransient');
    expect(xml).to.match(/<camunda:in\b[^>]*isTransient="true"/);
    expect(xml).to.match(/<camunda:out\b[^>]*isTransient="false"/);
  });


  it('should support plain isTransient on parameters but leave In/Out mappings untyped', async function() {

    // given
    const modeler = new BpmnModeler({
      ...DEFAULT_OPTIONS,
      container: modelerContainer
    });

    // when
    const { warnings } = await modeler.importXML(PLAIN_TRANSIENT_XML);
    const definitions = modeler.getDefinitions();
    const serviceTask = definitions.rootElements[0].flowElements.find((element) => element.$type === 'bpmn:ServiceTask');
    const inputOutput = serviceTask.extensionElements.values[0];
    const callActivity = definitions.rootElements[0].flowElements.find((element) => element.$type === 'bpmn:CallActivity');
    const inMapping = callActivity.extensionElements.values.find((value) => value.$type === 'camunda:In');
    const outMapping = callActivity.extensionElements.values.find((value) => value.$type === 'camunda:Out');

    // then
    expect(warnings).to.have.lengthOf(2);
    expect(inputOutput.inputParameters[0].get('isTransient')).to.equal(true);
    expect(inputOutput.outputParameters[0].get('isTransient')).to.equal(false);
    expect(inMapping.get('isTransient')).to.equal('true');
    expect(outMapping.get('isTransient')).to.equal('false');
  });


  it('should save plain isTransient by default', async function() {

    // given
    const modeler = new BpmnModeler({
      ...DEFAULT_OPTIONS,
      container: modelerContainer
    });

    // when
    await modeler.importXML(PLAIN_TRANSIENT_XML);
    const { xml } = await modeler.saveXML({ format: true });

    // then
    expect(xml).to.contain(' isTransient="true"');
    expect(xml).to.contain(' isTransient="false"');
    expect(xml).to.not.contain('camunda:isTransient=');
    expect(xml).to.match(/<camunda:in\b[^>]*isTransient="true"/);
    expect(xml).to.match(/<camunda:out\b[^>]*isTransient="false"/);
  });


  it('should preserve mixed transient attribute styles per occurrence when saving XML', async function() {

    // given
    const modeler = new BpmnModeler({
      ...DEFAULT_OPTIONS,
      container: modelerContainer
    });

    // when
    await modeler.importXML(MIXED_TRANSIENT_XML);
    const { xml } = await modeler.saveXML({ format: true });

    // then
    expect(xml).to.contain('camunda:inputParameter name="requiredInput" camunda:isTransient="true"');
    expect(xml).to.contain('camunda:outputParameter name="result" isTransient="false"');
  });


  it('should import self-closing restricted parameters with both transient styles without warnings', async function() {

    // given
    const modeler = new BpmnModeler({
      ...DEFAULT_OPTIONS,
      container: modelerContainer
    });

    // when
    const { warnings } = await modeler.importXML(RESTRICTED_TRANSIENT_SELF_CLOSING_XML);
    const definitions = modeler.getDefinitions();
    const serviceTask = definitions.rootElements[0].flowElements.find((element) => element.$type === 'bpmn:ServiceTask');
    const inputOutput = serviceTask.extensionElements.values[0];

    // then
    expect(warnings).to.be.empty;
    expect(inputOutput.inputParameters[0].get('restricted')).to.equal(true);
    expect(inputOutput.inputParameters[0].get('isTransient')).to.equal(true);
    expect(inputOutput.outputParameters[0].get('restricted')).to.equal(false);
    expect(inputOutput.outputParameters[0].get('isTransient')).to.equal(false);
  });


  describe('new context pad', function() {

    beforeEach(function() {
      Flags.reset();
    });


    it('should disable new context pad by default', async function() {

      // when
      const modeler = await createModeler();

      // then
      expect(modeler.get('improvedCanvas', false)).not.to.exist;
    });


    it('should enable new context pad if enabled through flag', async function() {

      // when
      Flags.init({
        [ ENABLE_NEW_CONTEXT_PAD ]: true
      });

      const modeler = await createModeler();

      // then
      expect(modeler.get('improvedCanvas', false)).to.exist;
    });


    it('should not fail when append element is triggered', async function() {

      // when
      Flags.init({
        [ ENABLE_NEW_CONTEXT_PAD ]: true
      });

      const modeler = await createModeler();

      // then
      const editorActions = modeler.get('editorActions'),
            event = new KeyboardEvent('keydown', { target: modelerContainer });

      expect(() => editorActions.trigger('appendElement', event)).not.to.throw();
    });

  });

});

// helpers //////////

/**
 * Create modeler and wait for modeler and overview import to finish before returning modeler.
 *
 * @param {Object} [options]
 *
 * @returns {Object}
 */
async function createModeler(options = {}) {
  const modeler = new BpmnModeler({
    ...DEFAULT_OPTIONS,
    ...options
  });

  return modeler.importXML(diagramXML).then(() => modeler);
}

function inlineCSS(css) {
  var head = document.head || document.getElementsByTagName('head')[ 0 ],
      style = document.createElement('style');

  style.type = 'text/css';

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}
