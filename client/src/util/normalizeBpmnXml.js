const TRANSIENT_ELEMENT_PATTERN = 'camunda:(?:inputParameter|outputParameter)';
export function normalizeCamundaTransientAttributes(xml) {
  if (typeof xml !== 'string') {
    return xml;
  }

  return xml.replace(
    new RegExp(`(<${TRANSIENT_ELEMENT_PATTERN}\\b[^>]*?)\\sisTransient=`, 'g'),
    '$1 camunda:isTransient='
  );
}

export function denormalizeCamundaTransientAttributes(xml) {
  if (typeof xml !== 'string') {
    return xml;
  }

  return xml.replace(
    new RegExp(`(<${TRANSIENT_ELEMENT_PATTERN}\\b[^>]*?)\\scamunda:isTransient=`, 'g'),
    '$1 isTransient='
  );
}

export function preserveCamundaTransientAttributeStyle(importedXml, exportedXml) {
  if (typeof importedXml !== 'string' || typeof exportedXml !== 'string') {
    return exportedXml;
  }

  const importedElements = getTransientElements(importedXml);

  if (!importedElements.length) {
    return exportedXml;
  }

  return exportedXml.replace(
    new RegExp(`<${TRANSIENT_ELEMENT_PATTERN}\\b[^>]*?>`, 'g'),
    (elementXml) => {
      const importedElement = findMatchingTransientElement(importedElements, elementXml);

      if (!importedElement || importedElement.attributeStyle !== 'camunda') {
        return elementXml;
      }

      return normalizeCamundaTransientAttributes(elementXml);
    }
  );
}

export function normalizeRestrictedAttributes(xml) {
  if (typeof xml !== 'string') {
    return xml;
  }

  return xml
    .replace(/\sxmlns:restricted="[^"]*"/g, '')
    .replace(/\srestricted:restricted=/g, ' restricted=');
}

function getTransientElements(xml) {
  const matches = xml.match(new RegExp(`<${TRANSIENT_ELEMENT_PATTERN}\\b[^>]*?>`, 'g')) || [];

  return matches
    .filter((elementXml) => /(?:\scamunda:isTransient=|\sisTransient=)/.test(elementXml))
    .map((elementXml) => ({
      type: getElementType(elementXml),
      identifier: getElementIdentifier(elementXml),
      attributeStyle: /\scamunda:isTransient=/.test(elementXml) ? 'camunda' : 'plain'
    }));
}

function findMatchingTransientElement(importedElements, exportedElementXml) {
  const type = getElementType(exportedElementXml);
  const identifier = getElementIdentifier(exportedElementXml);

  return importedElements.find((element) => element.type === type && element.identifier === identifier) || null;
}

function getElementType(elementXml) {
  const match = elementXml.match(/<((?:camunda:)?(?:inputParameter|outputParameter))\b/);

  return match ? match[1] : null;
}

function getElementIdentifier(elementXml) {
  const name = getAttributeValue(elementXml, 'name');

  if (name) {
    return `name:${name}`;
  }

  const source = getAttributeValue(elementXml, 'source');
  const target = getAttributeValue(elementXml, 'target');

  return `source:${source || ''}|target:${target || ''}`;
}

function getAttributeValue(elementXml, attributeName) {
  const match = elementXml.match(new RegExp(`\\s${attributeName}="([^"]*)"`, 'i'));

  return match ? match[1] : null;
}
