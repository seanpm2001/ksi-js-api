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

import { CalendarHashChainExistenceRule } from '../rule/CalendarHashChainExistenceRule.js';
import { ExtendedSignatureCalendarChainAggregationTimeRule } from '../rule/ExtendedSignatureCalendarChainAggregationTimeRule.js';
import { ExtendedSignatureCalendarChainInputHashRule } from '../rule/ExtendedSignatureCalendarChainInputHashRule.js';
import { ExtendedSignatureCalendarChainRootHashRule } from '../rule/ExtendedSignatureCalendarChainRootHashRule.js';
import { ExtendedSignatureCalendarHashChainRightLinksMatchRule } from '../rule/ExtendedSignatureCalendarHashChainRightLinksMatchRule.js';
import { SignaturePublicationRecordExistenceRule } from '../rule/SignaturePublicationRecordExistenceRule.js';
import { VerificationRule } from '../VerificationRule.js';
import { InternalVerificationPolicy } from './InternalVerificationPolicy.js';
import { VerificationPolicy } from './VerificationPolicy.js';

/**
 * Calendar based verification policy.
 */
export class CalendarBasedVerificationPolicy extends VerificationPolicy {
  /**
   * Calendar based verification policy constructor.
   */
  public constructor() {
    const verificationRule: VerificationRule = new ExtendedSignatureCalendarChainInputHashRule() // Cal-02
      .onSuccess(new ExtendedSignatureCalendarChainAggregationTimeRule()); // Cal-03

    super(
      new InternalVerificationPolicy().onSuccess(
        new CalendarHashChainExistenceRule() // // Gen-02
          .onSuccess(
            new SignaturePublicationRecordExistenceRule() // Gen-02
              .onSuccess(
                new ExtendedSignatureCalendarChainRootHashRule() // Cal-01
                  .onSuccess(verificationRule)
              )
              .onNa(
                new ExtendedSignatureCalendarHashChainRightLinksMatchRule() // Cal-4
                  .onSuccess(verificationRule)
              )
          )
          .onNa(verificationRule)
      ),
      'CalendarBasedVerificationPolicy'
    );
  }
}
