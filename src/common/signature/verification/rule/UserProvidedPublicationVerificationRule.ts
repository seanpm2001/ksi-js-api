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
import { PublicationData } from '../../../publication/PublicationData.js';
import { PublicationRecord } from '../../../publication/PublicationRecord.js';
import { KsiSignature } from '../../KsiSignature.js';
import { VerificationContext } from '../VerificationContext.js';
import { VerificationError } from '../VerificationError.js';
import { VerificationResult } from '../VerificationResult.js';
import { VerificationRule } from '../VerificationRule.js';

/**
 * Rule checks that user provided publication equals to publication in KSI signature.
 */
export class UserProvidedPublicationVerificationRule extends VerificationRule {
  public constructor() {
    super('UserProvidedPublicationVerificationRule');
  }

  /**
   * Verify current rule with given context.
   * @param context Verification context.
   * @returns Verification result.
   */
  public async verify(context: VerificationContext): Promise<VerificationResult> {
    const signature: KsiSignature = context.getSignature();
    const userPublication: PublicationData | null = context.getUserPublication();
    if (userPublication === null) {
      return new VerificationResult(this.getRuleName(), VerificationResultCode.NA, VerificationError.GEN_02());
    }

    const publicationRecord: PublicationRecord | null = signature.getPublicationRecord();
    if (publicationRecord === null) {
      return new VerificationResult(this.getRuleName(), VerificationResultCode.NA, VerificationError.GEN_02());
    }

    if (userPublication.getPublicationTime().neq(publicationRecord.getPublicationTime())) {
      console.debug(
        `User provided publication time does not equal to signature publication time. User provided publication time: ${userPublication.getPublicationTime()}; Signature publication time: ${publicationRecord.getPublicationTime()}.`
      );

      return new VerificationResult(this.getRuleName(), VerificationResultCode.NA, VerificationError.GEN_02());
    }

    return !userPublication.getPublicationHash().equals(publicationRecord.getPublicationHash())
      ? new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.PUB_04())
      : new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
  }
}
