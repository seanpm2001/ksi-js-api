/*
 * Copyright 2013-2022 Guardtime, Inc.
 *
 * This file is part of the Guardtime client SDK.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES, CONDITIONS, OR OTHER LICENSES OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 * "Guardtime" and "KSI" are trademarks or registered trademarks of
 * Guardtime, Inc., and no license to trademarks is granted; Guardtime
 * reserves and retains all trademark rights.
 */

import { ResultCode as VerificationResultCode } from '@guardtime/common/lib/verification/Result.js';
import { KsiSignature } from '../../KsiSignature.js';
import { Rfc3161Record } from '../../Rfc3161Record.js';
import { VerificationContext } from '../VerificationContext.js';
import { VerificationError } from '../VerificationError.js';
import { VerificationResult } from '../VerificationResult.js';
import { VerificationRule } from '../VerificationRule.js';

/**
 * Verifies that all hash algorithms used internally in RFC3161 record were not deprecated at the aggregation time.
 * If RFC3161 record is not present, {@see VerificationResultCode.OK} is returned.
 */
export class Rfc3161RecordHashAlgorithmDeprecatedRule extends VerificationRule {
  public constructor() {
    super('Rfc3161RecordHashAlgorithmDeprecatedRule');
  }

  /**
   * Verify current rule with given context.
   * @param context Verification context.
   * @returns Verification result.
   */
  public async verify(context: VerificationContext): Promise<VerificationResult> {
    const signature: KsiSignature = context.getSignature();
    const rfc3161Record: Rfc3161Record | null = signature.getRfc3161Record();

    if (rfc3161Record === null) {
      return new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
    }

    if (
      rfc3161Record.getTstInfoAlgorithm() != null &&
      rfc3161Record.getTstInfoAlgorithm().isDeprecated(rfc3161Record.getAggregationTime().valueOf())
    ) {
      console.debug(
        `Hash algorithm used to hash the TSTInfo structure was deprecated at aggregation time. Algorithm: ${
          rfc3161Record.getTstInfoAlgorithm().name
        }; Aggregation time: ${rfc3161Record.getAggregationTime()}.`
      );

      return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_14());
    }

    if (
      rfc3161Record.getSignedAttributesAlgorithm() != null &&
      rfc3161Record.getSignedAttributesAlgorithm().isDeprecated(rfc3161Record.getAggregationTime().valueOf())
    ) {
      console.debug(
        `Hash algorithm used to hash the SignedAttributes structure was deprecated at aggregation time. Algorithm: ${
          rfc3161Record.getSignedAttributesAlgorithm().name
        }; Aggregation time: ${rfc3161Record.getAggregationTime()}.`
      );

      return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_14());
    }

    return new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
  }
}
