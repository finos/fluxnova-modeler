import camundaModdle from 'camunda-bpmn-moddle/resources/camunda';

const IS_TRANSIENT_PROPERTY = {
  name: 'isTransient',
  isAttr: true,
  type: 'Boolean'
};

const IS_RESTRICTED_PROPERTY = {
  name: 'restricted',
  isAttr: true,
  type: 'Boolean'
};

const TRANSIENT_PARAMETER_TRAITS = [
  {
    name: 'InputParameterTransientTrait',
    extends: [
      'camunda:InputParameter'
    ],
    properties: [
      IS_TRANSIENT_PROPERTY
    ]
  },
  {
    name: 'OutputParameterTransientTrait',
    extends: [
      'camunda:OutputParameter'
    ],
    properties: [
      IS_TRANSIENT_PROPERTY
    ]
  }
];

const RESTRICTED_PARAMETER_TRAITS = [
  {
    name: 'InputParameterRestrictedTrait',
    extends: [
      'camunda:InputParameter'
    ],
    properties: [
      IS_RESTRICTED_PROPERTY
    ]
  },
  {
    name: 'OutputParameterRestrictedTrait',
    extends: [
      'camunda:OutputParameter'
    ],
    properties: [
      IS_RESTRICTED_PROPERTY
    ]
  },
  {
    name: 'InRestrictedTrait',
    extends: [
      'camunda:In'
    ],
    properties: [
      IS_RESTRICTED_PROPERTY
    ]
  },
  {
    name: 'OutRestrictedTrait',
    extends: [
      'camunda:Out'
    ],
    properties: [
      IS_RESTRICTED_PROPERTY
    ]
  }
];

export default {
  ...camundaModdle,
  types: [
    ...camundaModdle.types,
    ...TRANSIENT_PARAMETER_TRAITS,
    ...RESTRICTED_PARAMETER_TRAITS
  ]
};
