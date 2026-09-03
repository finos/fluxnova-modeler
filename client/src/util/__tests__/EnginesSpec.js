/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  getLatestStable,
  ENGINES
} from '../Engines';


describe('util/Engines', function() {

  describe('should provide latestStable', function() {

    function verifyLatestStable(platform, expected) {

      return function() {

        // then
        expect(getLatestStable(platform)).to.eql(expected);
      };
    }

    it('Camunda Platform', verifyLatestStable(ENGINES.PLATFORM, '7.22.0'));

    it('Fluxnova Platform', verifyLatestStable(ENGINES.FLUXNOVA, '3.0.0'));

    it('Camunda Cloud', verifyLatestStable(ENGINES.CLOUD, '8.6.0'));

  });

});
