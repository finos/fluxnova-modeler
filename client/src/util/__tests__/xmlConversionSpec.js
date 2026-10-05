import { toBpmnXml, toDmnXml, getBpmnDefinitions } from '../xmlConversion';
import BpmnModdle from 'bpmn-moddle';
import DmnModdle from 'dmn-moddle';
import CamundaBpmnModdle from '../../moddle/camunda-bpmn-moddle';
import FluxnovaBpmnModdle from '../../moddle/fluxnova-bpmn-moddle';
import FluxnovaModelerModdle from '../../moddle/fluxnova-bpmn-modeler-moddle';

describe('util - xmlConversionSpec', function() {

  describe('toBpmnXml', function() {

    const moddle = new BpmnModdle();

    it('should convert from definitions to xml', async function() {

      const expected = '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"';

      const definitions = moddle.create('bpmn:Definitions');

      const { xml } = await toBpmnXml(definitions);

      expect(xml).to.contains(expected);

    });

  });

  describe('toDmnXml', function() {

    const moddle = new DmnModdle();

    it('should convert from definitions to xml', async function() {

      const expected = '<dmn:definitions xmlns:dmn="https://www.omg.org/spec/DMN/20191111/MODEL/" />';

      const definitions = moddle.create('dmn:Definitions');

      const { xml } = await toDmnXml(definitions);

      expect(xml).to.contain(expected);

    });

  });

  describe('Ad Hoc SubProcess with Fluxnova extensions', function() {

    const adHocSubProcessXml = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
      '                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"' +
      '                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"' +
      '                   xmlns:fluxnova="http://fluxnova.finos.org/schema/1.0/bpmn"' +
      '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
      '  <bpmn:process id="Process_1" isExecutable="true">' +
      '    <bpmn:adHocSubProcess id="AdHocSubProcess_1" cancelRemainingInstances="true">' +
      '      <bpmn:extensionElements>' +
      '        <fluxnova:Properties>' +
      '          <fluxnova:Property name="activeTasksCollection" value="taskA,taskB" />' +
      '        </fluxnova:Properties>' +
      '      </bpmn:extensionElements>' +
      '      <bpmn:completionCondition xsi:type="bpmn:tFormalExpression"' +
      '      <bpmn:completionCondition>' + '${approved == true}' + '</bpmn:completionCondition>' +
      '      <bpmn:userTask id="taskA" name="Task A" />' +
      '      <bpmn:userTask id="taskB" name="Task B" />' +
      '    </bpmn:adHocSubProcess>' +
      '  </bpmn:process>' +
      '</bpmn:definitions>';

    it('should parse and preserve fluxnova:properties with completionCondition', async function() {

      const definitions = await getBpmnDefinitions(adHocSubProcessXml, 'bpmn');

      const process = definitions.rootElements[0];
      const adHocSubProcess = process.flowElements[0];

      expect(adHocSubProcess.id).to.equal('AdHocSubProcess_1');
      expect(adHocSubProcess.cancelRemainingInstances).to.equal(true);

      const extensionElements = adHocSubProcess.extensionElements;
      expect(extensionElements).to.exist;

      const fluxnovaProperties = extensionElements.values.find((v) => v.$type === 'fluxnova:Properties');
      expect(fluxnovaProperties).to.exist;

      const activeTasksProperty = fluxnovaProperties.values.find((p) => p.name === 'activeTasksCollection');
      expect(activeTasksProperty).to.exist;
      expect(activeTasksProperty.value).to.equal('taskA,taskB');

      const completionCondition = adHocSubProcess.completionCondition;
      expect(completionCondition).to.exist;
      expect(completionCondition.body).to.include('approved');

    });

    it('should export and preserve fluxnova:properties', async function() {

      const moddle = new BpmnModdle({
        modeler: FluxnovaModelerModdle,
        fluxnova: FluxnovaBpmnModdle,
        camunda: CamundaBpmnModdle
      });
      const { rootElement: definitions } = await moddle.fromXML(adHocSubProcessXml);
      const { xml } = await moddle.toXML(definitions, { format: true });

      expect(xml).to.contain('xmlns:fluxnova="http://fluxnova.finos.org/schema/1.0/bpmn"');
      expect(xml).to.contain('fluxnova:properties');
      expect(xml).to.contain('fluxnova:property');
      expect(xml).to.contain('name="activeTasksCollection"');
      expect(xml).to.contain('value="taskA,taskB"');
      expect(xml).to.contain('completionCondition');

    });

    it('should parse activeTasksCollection property only', async function() {

      const xmlOnlyActiveTasksCollection = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
        '                   xmlns:fluxnova="http://fluxnova.finos.org/schema/1.0/bpmn"' +
        '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
        '  <bpmn:process id="Process_1" isExecutable="true">' +
        '    <bpmn:adHocSubProcess id="AdHocSubProcess_1">' +
        '      <bpmn:extensionElements>' +
        '        <fluxnova:Properties>' +
        '          <fluxnova:Property name="activeTasksCollection" value="${taskList}" />' +
        '        </fluxnova:Properties>' +
        '      </bpmn:extensionElements>' +
        '    </bpmn:adHocSubProcess>' +
        '  </bpmn:process>' +
        '</bpmn:definitions>';

      const definitions = await getBpmnDefinitions(xmlOnlyActiveTasksCollection, 'bpmn');
      const adHocSubProcess = definitions.rootElements[0].flowElements[0];

      const extensionElements = adHocSubProcess.extensionElements;
      const fluxnovaProperties = extensionElements.values.find((v) => v.$type === 'fluxnova:Properties');
      const activeTasksProperty = fluxnovaProperties.values.find((p) => p.name === 'activeTasksCollection');
      const autoCompleteProperty = fluxnovaProperties.values.find((p) => p.name === 'autoComplete');

      expect(activeTasksProperty).to.exist;
      expect(activeTasksProperty.value).to.equal('${taskList}');
      expect(autoCompleteProperty).to.not.exist;
    });

    it('should parse autoComplete attribute when false', async function() {

      const xmlWithAutoCompleteFalse = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
        '                   xmlns:fluxnova="http://fluxnova.finos.org/schema/1.0/bpmn"' +
        '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
        '  <bpmn:process id="Process_1" isExecutable="true">' +
        '    <bpmn:adHocSubProcess id="AdHocSubProcess_1" fluxnova:autoComplete="false">' +
        '      <bpmn:extensionElements>' +
        '        <fluxnova:Properties>' +
        '          <fluxnova:Property name="activeTasksCollection" value="taskA,taskB" />' +
        '        </fluxnova:Properties>' +
        '      </bpmn:extensionElements>' +
        '    </bpmn:adHocSubProcess>' +
        '  </bpmn:process>' +
        '</bpmn:definitions>';

      const definitions = await getBpmnDefinitions(xmlWithAutoCompleteFalse, 'bpmn');
      const adHocSubProcess = definitions.rootElements[0].flowElements[0];

      expect(adHocSubProcess.autoComplete).to.equal(false);
    });

    it('should parse completionCondition only', async function() {

      const xmlOnlyCompletionCondition = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
        '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
        '  <bpmn:process id="Process_1" isExecutable="true">' +
        '    <bpmn:adHocSubProcess id="AdHocSubProcess_1">' +
        '      <bpmn:completionCondition>${allTasksComplete}</bpmn:completionCondition>' +
        '    </bpmn:adHocSubProcess>' +
        '  </bpmn:process>' +
        '</bpmn:definitions>';

      const definitions = await getBpmnDefinitions(xmlOnlyCompletionCondition, 'bpmn');
      const adHocSubProcess = definitions.rootElements[0].flowElements[0];

      const completionCondition = adHocSubProcess.completionCondition;
      expect(completionCondition).to.exist;
      expect(completionCondition.body).to.equal('${allTasksComplete}');
    });

    it('should parse cancelRemainingInstances attribute', async function() {

      const xmlWithCancelRemainingInstances = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
        '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
        '  <bpmn:process id="Process_1" isExecutable="true">' +
        '    <bpmn:adHocSubProcess id="AdHocSubProcess_1" cancelRemainingInstances="false">' +
        '    </bpmn:adHocSubProcess>' +
        '  </bpmn:process>' +
        '</bpmn:definitions>';

      const definitions = await getBpmnDefinitions(xmlWithCancelRemainingInstances, 'bpmn');
      const adHocSubProcess = definitions.rootElements[0].flowElements[0];

      expect(adHocSubProcess.cancelRemainingInstances).to.equal(false);
    });

    it('should export activeTasksCollection with expression values', async function() {

      const xmlWithExpressions = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
        '                   xmlns:fluxnova="http://fluxnova.finos.org/schema/1.0/bpmn"' +
        '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
        '  <bpmn:process id="Process_1" isExecutable="true">' +
        '    <bpmn:adHocSubProcess id="AdHocSubProcess_1">' +
        '      <bpmn:extensionElements>' +
        '        <fluxnova:Properties>' +
        '          <fluxnova:Property name="activeTasksCollection" value="task1,task2,task3" />' +
        '        </fluxnova:Properties>' +
        '      </bpmn:extensionElements>' +
        '    </bpmn:adHocSubProcess>' +
        '  </bpmn:process>' +
        '</bpmn:definitions>';

      const moddle = new BpmnModdle({
        fluxnova: FluxnovaBpmnModdle,
        modeler: FluxnovaModelerModdle
      });
      const { rootElement: definitions } = await moddle.fromXML(xmlWithExpressions);
      const { xml } = await moddle.toXML(definitions, { format: true });

      expect(xml).to.contain('name="activeTasksCollection"');
      expect(xml).to.contain('value="task1,task2,task3"');
      expect(xml).to.not.contain('fluxnova:autoComplete=');
    });

    it('should export autoComplete attribute when false', async function() {

      const xmlWithAutoCompleteFalse = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
        '                   xmlns:fluxnova="http://fluxnova.finos.org/schema/1.0/bpmn"' +
        '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
        '  <bpmn:process id="Process_1" isExecutable="true">' +
        '    <bpmn:adHocSubProcess id="AdHocSubProcess_1" fluxnova:autoComplete="false">' +
        '      <bpmn:extensionElements>' +
        '        <fluxnova:Properties>' +
        '          <fluxnova:Property name="activeTasksCollection" value="taskA,taskB" />' +
        '        </fluxnova:Properties>' +
        '      </bpmn:extensionElements>' +
        '    </bpmn:adHocSubProcess>' +
        '  </bpmn:process>' +
        '</bpmn:definitions>';

      const moddle = new BpmnModdle({
        fluxnova: FluxnovaBpmnModdle,
        modeler: FluxnovaModelerModdle
      });
      const { rootElement: definitions } = await moddle.fromXML(xmlWithAutoCompleteFalse);
      const { xml } = await moddle.toXML(definitions, { format: true });

      expect(xml).to.contain('fluxnova:autoComplete="false"');
      expect(xml).to.not.contain('name="autoComplete"');
    });

    it('should handle AdHocSubProcess with no Fluxnova properties', async function() {

      const plainAdHocSubProcessXml = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
        '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
        '  <bpmn:process id="Process_1" isExecutable="true">' +
        '    <bpmn:adHocSubProcess id="AdHocSubProcess_1" />' +
        '  </bpmn:process>' +
        '</bpmn:definitions>';

      const definitions = await getBpmnDefinitions(plainAdHocSubProcessXml, 'bpmn');
      const adHocSubProcess = definitions.rootElements[0].flowElements[0];

      expect(adHocSubProcess.id).to.equal('AdHocSubProcess_1');
      expect(adHocSubProcess.extensionElements).to.not.exist;
    });

    it('should handle AdHocSubProcess with multiple properties', async function() {

      const xmlMultipleProperties = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
        '                   xmlns:fluxnova="http://fluxnova.finos.org/schema/1.0/bpmn"' +
        '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
        '  <bpmn:process id="Process_1" isExecutable="true">' +
        '    <bpmn:adHocSubProcess id="AdHocSubProcess_1" cancelRemainingInstances="true">' +
        '      <bpmn:extensionElements>' +
        '        <fluxnova:Properties>' +
        '          <fluxnova:Property name="activeTasksCollection" value="taskA,taskB" />' +
        '          <fluxnova:Property name="otherProperty" value="someValue" />' +
        '        </fluxnova:Properties>' +
        '      </bpmn:extensionElements>' +
        '      <bpmn:completionCondition>${completed}</bpmn:completionCondition>' +
        '    </bpmn:adHocSubProcess>' +
        '  </bpmn:process>' +
        '</bpmn:definitions>';

      const definitions = await getBpmnDefinitions(xmlMultipleProperties, 'bpmn');
      const adHocSubProcess = definitions.rootElements[0].flowElements[0];

      expect(adHocSubProcess.extensionElements).to.exist;
      const fluxnovaProperties = adHocSubProcess.extensionElements.values.find((v) => v.$type === 'fluxnova:Properties');
      expect(fluxnovaProperties.values).to.have.length.greaterThan(0);
      expect(fluxnovaProperties.values.some(p => p.name === 'activeTasksCollection')).to.be.true;
      expect(fluxnovaProperties.values.some(p => p.name === 'otherProperty')).to.be.true;
    });

    it('should round-trip completionCondition with complex expressions', async function() {

      const xmlComplexExpression = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
        '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
        '  <bpmn:process id="Process_1" isExecutable="true">' +
        '    <bpmn:adHocSubProcess id="AdHocSubProcess_1">' +
        '      <bpmn:completionCondition>${count >= threshold &amp;&amp; approved == true}</bpmn:completionCondition>' +
        '    </bpmn:adHocSubProcess>' +
        '  </bpmn:process>' +
        '</bpmn:definitions>';

      const moddle = new BpmnModdle();
      const { rootElement: definitions } = await moddle.fromXML(xmlComplexExpression);
      const { xml: exportedXml } = await moddle.toXML(definitions, { format: true });

      const adHocSubProcess = definitions.rootElements[0].flowElements[0];
      expect(adHocSubProcess.completionCondition.body).to.include('count >= threshold');
      expect(adHocSubProcess.completionCondition.body).to.include('approved == true');
      expect(exportedXml).to.contain('completionCondition');
    });

  });

  describe('Camunda isTransient support', function() {

    const camundaTransientXml = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
      '                   xmlns:camunda="http://camunda.org/schema/1.0/bpmn"' +
      '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
      '  <bpmn:process id="Process_1" isExecutable="true">' +
      '    <bpmn:serviceTask id="Activity_1">' +
      '      <bpmn:extensionElements>' +
      '        <camunda:inputOutput>' +
      '          <camunda:inputParameter name="requiredInput" camunda:isTransient="true">demo</camunda:inputParameter>' +
      '          <camunda:outputParameter name="result" camunda:isTransient="false">value</camunda:outputParameter>' +
      '        </camunda:inputOutput>' +
      '      </bpmn:extensionElements>' +
      '    </bpmn:serviceTask>' +
      '    <bpmn:callActivity id="CallActivity_1">' +
      '      <bpmn:extensionElements>' +
      '        <camunda:in source="sourceVar" target="targetVar" camunda:isTransient="true" />' +
      '        <camunda:out source="resultVar" target="outerVar" camunda:isTransient="false" />' +
      '      </bpmn:extensionElements>' +
      '    </bpmn:callActivity>' +
      '  </bpmn:process>' +
      '</bpmn:definitions>';

    const plainTransientXml = camundaTransientXml
      .replaceAll(' camunda:isTransient=', ' isTransient=');

    const mixedTransientXml = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
      '                   xmlns:camunda="http://camunda.org/schema/1.0/bpmn"' +
      '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
      '  <bpmn:process id="Process_1" isExecutable="true">' +
      '    <bpmn:serviceTask id="Activity_1">' +
      '      <bpmn:extensionElements>' +
      '        <camunda:inputOutput>' +
      '          <camunda:inputParameter name="requiredInput" camunda:isTransient="true">demo</camunda:inputParameter>' +
      '          <camunda:outputParameter name="result" isTransient="false">value</camunda:outputParameter>' +
      '        </camunda:inputOutput>' +
      '      </bpmn:extensionElements>' +
      '    </bpmn:serviceTask>' +
      '  </bpmn:process>' +
      '</bpmn:definitions>';

    const restrictedAndTransientXml = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
      '                   xmlns:camunda="http://camunda.org/schema/1.0/bpmn"' +
      '                   id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
      '  <bpmn:process id="Process_1" isExecutable="true">' +
      '    <bpmn:serviceTask id="Activity_1">' +
      '      <bpmn:extensionElements>' +
      '        <camunda:inputOutput>' +
      '          <camunda:inputParameter name="requiredInput" restricted="true" camunda:isTransient="true">demo</camunda:inputParameter>' +
      '          <camunda:outputParameter name="result" restricted="false" isTransient="false">value</camunda:outputParameter>' +
      '        </camunda:inputOutput>' +
      '      </bpmn:extensionElements>' +
      '    </bpmn:serviceTask>' +
      '  </bpmn:process>' +
      '</bpmn:definitions>';

    const fluxnovaRestrictedTransientXml = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"' +
      '                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"' +
      '                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"' +
      '                   xmlns:modeler="http://fluxnova.finos.org/schema/modeler/1.0"' +
      '                   xmlns:camunda="http://camunda.org/schema/1.0/bpmn"' +
      '                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"' +
      '                   id="Definitions_1oc37y6"' +
      '                   targetNamespace="http://bpmn.io/schema/bpmn"' +
      '                   exporter="Fluxnova Modeler"' +
      '                   exporterVersion="1.3.2-dev"' +
      '                   modeler:executionPlatform="Fluxnova Platform"' +
      '                   modeler:executionPlatformVersion="3.0.0">' +
      '  <bpmn:process id="Process_1my4l7q" isExecutable="true" camunda:historyTimeToLive="30">' +
      '    <bpmn:serviceTask id="Activity_11njh03">' +
      '      <bpmn:extensionElements>' +
      '        <camunda:inputOutput>' +
      '          <camunda:inputParameter name="Input_1sfaa6v" isTransient="true" restricted="true" />' +
      '        </camunda:inputOutput>' +
      '      </bpmn:extensionElements>' +
      '    </bpmn:serviceTask>' +
      '  </bpmn:process>' +
      '</bpmn:definitions>';

    it('should parse camunda:isTransient on parameters but not In/Out mappings', async function() {
      const definitions = await getBpmnDefinitions(camundaTransientXml, 'bpmn');
      const serviceTask = definitions.rootElements[0].flowElements.find((element) => element.id === 'Activity_1');
      const callActivity = definitions.rootElements[0].flowElements.find((element) => element.id === 'CallActivity_1');
      const inputOutput = serviceTask.extensionElements.values[0];
      const inMapping = callActivity.extensionElements.values.find((value) => value.$type === 'camunda:In');
      const outMapping = callActivity.extensionElements.values.find((value) => value.$type === 'camunda:Out');

      expect(inputOutput.inputParameters[0].get('isTransient')).to.equal(true);
      expect(inputOutput.outputParameters[0].get('isTransient')).to.equal(false);
      expect(inMapping.get('isTransient')).to.be.undefined;
      expect(outMapping.get('isTransient')).to.be.undefined;
    });

    it('should import and serialize without switching to the fluxnova namespace', async function() {
      const moddle = new BpmnModdle({
        camunda: CamundaBpmnModdle,
        fluxnova: FluxnovaBpmnModdle,
        modeler: FluxnovaModelerModdle
      });

      const { rootElement: definitions } = await moddle.fromXML(camundaTransientXml);
      const { xml } = await toBpmnXml(definitions);

      expect(xml).to.not.contain('fluxnova:isTransient');
      expect(xml).to.contain('camunda:inputParameter');
      expect(xml).to.contain('camunda:outputParameter');
      expect(xml).to.contain('camunda:in');
      expect(xml).to.contain('camunda:out');
      expect(xml).to.contain(' isTransient="true"');
      expect(xml).to.contain(' isTransient="false"');
      expect(xml).to.not.contain('camunda:isTransient=');
      expect(xml).to.match(/<camunda:in\b[^>]*isTransient="true"/);
      expect(xml).to.match(/<camunda:out\b[^>]*isTransient="false"/);
    });

    it('should parse plain isTransient on parameters but leave In/Out mappings untyped', async function() {
      const definitions = await getBpmnDefinitions(plainTransientXml, 'bpmn');
      const serviceTask = definitions.rootElements[0].flowElements.find((element) => element.id === 'Activity_1');
      const callActivity = definitions.rootElements[0].flowElements.find((element) => element.id === 'CallActivity_1');
      const inputOutput = serviceTask.extensionElements.values[0];
      const inMapping = callActivity.extensionElements.values.find((value) => value.$type === 'camunda:In');
      const outMapping = callActivity.extensionElements.values.find((value) => value.$type === 'camunda:Out');

      expect(inputOutput.inputParameters[0].get('isTransient')).to.equal(true);
      expect(inputOutput.outputParameters[0].get('isTransient')).to.equal(false);
      expect(inMapping.get('isTransient')).to.equal('true');
      expect(outMapping.get('isTransient')).to.equal('false');
    });

    it('should export plain isTransient by default', async function() {
      const moddle = new BpmnModdle({
        camunda: CamundaBpmnModdle,
        fluxnova: FluxnovaBpmnModdle,
        modeler: FluxnovaModelerModdle
      });

      const { rootElement: definitions } = await moddle.fromXML(plainTransientXml);
      const { xml } = await toBpmnXml(definitions);

      expect(xml).to.contain(' isTransient="true"');
      expect(xml).to.contain(' isTransient="false"');
      expect(xml).to.not.contain('camunda:isTransient=');
      expect(xml).to.match(/<camunda:in\b[^>]*isTransient="true"/);
      expect(xml).to.match(/<camunda:out\b[^>]*isTransient="false"/);
    });

    it('should keep parsing mixed transient attribute styles', async function() {
      const definitions = await getBpmnDefinitions(mixedTransientXml, 'bpmn');
      const serviceTask = definitions.rootElements[0].flowElements.find((element) => element.id === 'Activity_1');
      const inputOutput = serviceTask.extensionElements.values[0];

      expect(inputOutput.inputParameters[0].get('isTransient')).to.equal(true);
      expect(inputOutput.outputParameters[0].get('isTransient')).to.equal(false);
    });

    it('should parse restricted attributes together with transient attributes', async function() {
      const definitions = await getBpmnDefinitions(restrictedAndTransientXml, 'bpmn');
      const serviceTask = definitions.rootElements[0].flowElements.find((element) => element.id === 'Activity_1');
      const inputOutput = serviceTask.extensionElements.values[0];

      expect(inputOutput.inputParameters[0].get('restricted')).to.equal(true);
      expect(inputOutput.inputParameters[0].get('isTransient')).to.equal(true);
      expect(inputOutput.outputParameters[0].get('restricted')).to.equal(false);
      expect(inputOutput.outputParameters[0].get('isTransient')).to.equal(false);
    });

    it('should parse Fluxnova BPMN with self-closing restricted and plain transient attributes', async function() {
      const definitions = await getBpmnDefinitions(fluxnovaRestrictedTransientXml, 'bpmn');
      const serviceTask = definitions.rootElements[0].flowElements.find((element) => element.id === 'Activity_11njh03');
      const inputOutput = serviceTask.extensionElements.values[0];

      expect(inputOutput.inputParameters[0].get('restricted')).to.equal(true);
      expect(inputOutput.inputParameters[0].get('isTransient')).to.equal(true);
    });
  });

});
