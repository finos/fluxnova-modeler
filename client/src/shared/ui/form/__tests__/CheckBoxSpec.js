/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import { render } from '@testing-library/react';

import { CheckBox } from '..';


describe('<CheckBox>', function() {

  it('should render', function() {
    createCheckBox();
  });


  it('should pass field name to the error callback', function() {

    // given
    const fieldError = sinon.spy();
    const field = {
      name: 'name'
    };
    const fieldMeta = {
      error: 'foo',
      touched: true
    };

    // when
    createCheckBox({
      field,
      fieldError,
      fieldMeta
    });

    // then
    expect(fieldError).to.have.been.calledOnceWithExactly(fieldMeta, field.name);
  });
});


// helpers ///////////////////

function createCheckBox(options = {}) {
  const {
    field,
    fieldMeta,
    ...props
  } = options;

  const form = {
    getFieldMeta: () => {
      return fieldMeta || {};
    }
  };

  return render(<CheckBox
    { ...props }
    field={ field || {} }
    form={ form }
  />);
}