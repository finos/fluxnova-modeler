/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { is } from 'bpmn-js/lib/util/ModelUtil';

import BpmnModdle from 'bpmn-moddle';
import DmnModdle from 'dmn-moddle';

import CamundaBpmnModdle from 'camunda-bpmn-moddle/resources/camunda';
import CamundaDmnModdle from 'camunda-dmn-moddle/resources/camunda';
import ZeebeBpmnModdle from 'zeebe-bpmn-moddle/resources/zeebe';
import FluxnovaModelerModdle from '../moddle/fluxnova-bpmn-modeler-moddle';
import FluxnovaBpmnModdle from '../moddle/fluxnova-bpmn-moddle';

import { selfAndAllFlowElements } from './elementsUtil';
import parseExecutionPlatform from '../app/util/parseExecutionPlatform';
import { ENGINES } from './Engines';

export async function getBpmnDefinitionsForConversion(xml) {
  return await getBpmnDefinitions(xml, 'bpmn', null);
}

export async function getDmnDefinitionsForConversion(xml) {
  const extensions = {
    camunda: CamundaDmnModdle
  };

  const moddle = new DmnModdle(extensions);

  const { rootElement: definitions } = await moddle.fromXML(xml);

  return definitions;
}


export async function getBpmnDefinitions(xml, diagramType, modelerModdle = FluxnovaModelerModdle) {

  const extensions = {};

  // Conversion path passes modelerModdle = null and should not force custom
  // namespace registration. Runtime/editor paths use the default moddle.
  if (modelerModdle) {
    extensions.modeler = modelerModdle;
    extensions.fluxnova = FluxnovaBpmnModdle;
  }

  if (diagramType === 'bpmn') {
    extensions.camunda = CamundaBpmnModdle;
  }

  if (diagramType === 'cloud-bpmn') {
    extensions.zeebe = ZeebeBpmnModdle;
  }

  const moddle = new BpmnModdle(extensions);

  const { rootElement: definitions } = await moddle.fromXML(xml);

  return definitions;
}


export async function getEngineProfile(contents, resourceType) {

  let engineProfile;

  if (!contents) {
    return {};
  }

  if (resourceType === 'form') {
    engineProfile = parsFormExecutionPlatform(contents);

    if (!engineProfile) return null;

  } else {
    engineProfile = {
      ...parseExecutionPlatform(contents)
    };
  }

  const { executionPlatform } = engineProfile;

  engineProfile.executionPlatform = executionPlatform || getDefaultExecutionPlatform();

  return engineProfile;
}

/**
 * Return all elements of a given type in a diagram,
 * and an empty array if none exist.
 *
 * @param {String} xml
 * @param {String} elementType
 * @param {String} diagramType
 *
 * @return {Array<Object>} a list of elements matching the type
 */
export async function getAllElementsByType(xml, elementType, diagramType) {
  const definitions = await getBpmnDefinitions(xml, diagramType);

  const processes = definitions.rootElements.filter((e) => is(e, 'bpmn:Process'));
  const elements = [];

  processes.forEach((process) => {
    const flowElements = selfAndAllFlowElements(process, false);
    elements.push(...flowElements.filter((flowElement) => is(flowElement, elementType)));
  });

  return elements;
}

export function parseFormFieldCounts(contents) {

  if (!contents) {
    return {};
  }

  // parse form content
  let form;
  try {
    form = JSON.parse(contents);
  } catch (error) {
    return {};
  }

  // flatten nested components
  const components = form.components || [];

  function getComponents(components) {
    const formFields = [];

    components.forEach((component) => {
      formFields.push(component);

      if (component.components && component.components.length > 0) {
        formFields.push(...getComponents(component.components));
      }
    });

    return formFields;
  }

  const formFields = getComponents(components);

  // collect form field counts by type
  const typeCounts = {};

  formFields.forEach((component) => {
    const { type } = component;

    if (typeCounts[type]) {
      typeCounts[type]++;
    } else {
      typeCounts[type] = 1;
    }
  });

  return typeCounts;
}

export async function toBpmnXml(definitions) {
  const extensions = {
    camunda: CamundaBpmnModdle,
    fluxnova: FluxnovaBpmnModdle
  };

  const moddle = new BpmnModdle(extensions);
  return await moddle.toXML(definitions, { format: true });
}

export async function toDmnXml(definitions) {
  const extensions = {
    camunda: CamundaDmnModdle
  };

  const moddle = new DmnModdle(extensions);
  return await moddle.toXML(definitions, { format: true });
}

function getDefaultExecutionPlatform() {
  return ENGINES.FLUXNOVA;
}

function parsFormExecutionPlatform(contents) {
  try {
    const value = JSON.parse(contents);

    return {
      executionPlatform: value.executionPlatform,
      executionPlatformVersion: value.executionPlatformVersion
    };

  } catch (error) {
    return null;
  }
}
