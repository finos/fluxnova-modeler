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
import { userEvent } from '@testing-library/user-event';

import { Radio } from '..';


describe('<Radio>', function() {

  it('should render', function() {
    createRadio();
  });


  it('should check option', function() {

    // when
    const { container } = createRadio({
      fieldMeta: {
        value: 'foo'
      },
      values: [
        {
          value: 'foo',
          label: 'bar'
        }
      ]
    });

    const checkedInput = container.querySelectorAll('.custom-control-input');

    // then
    expect(checkedInput).to.have.length(1);
    expect(checkedInput[0].checked).to.be.true;
  });


  it('should apply field\'s onChange callback', async function() {

    // given
    const onChange = sinon.spy();
    const { container } = createRadio({
      field: {
        onChange
      },
      values: [
        {
          value: 'foo',
          label: 'bar'
        }
      ]
    });
    const input = container.querySelector('.custom-control-input');

    // when
    await userEvent.click(input);

    // then
    expect(onChange).to.have.been.calledOnce;
  });
});


// helpers ///////////////

function createRadio(options = {}) {

  const form = options.form || {
    getFieldMeta: () => {
      return options.fieldMeta || {};
    }
  };

  return render(<Radio
    field={ options.field || {} }
    form={ form }
    values={ options.values || [] }
  />);
}
