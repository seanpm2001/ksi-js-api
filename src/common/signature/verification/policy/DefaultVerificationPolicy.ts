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

import { VerificationPolicy } from './VerificationPolicy.js';
import { InternalVerificationPolicy } from './InternalVerificationPolicy.js';
import { PublicationBasedVerificationPolicy } from './PublicationBasedVerificationPolicy.js';
import { KeyBasedVerificationPolicy } from './KeyBasedVerificationPolicy.js';

/**
 * Default verification policy.
 */
export class DefaultVerificationPolicy extends VerificationPolicy {
  /**
   * Default verification policy constructor.
   */
  public constructor() {
    super(
      new InternalVerificationPolicy().onSuccess(
        PublicationBasedVerificationPolicy.CREATE_POLICY_WO_INTERNAL_POLICY().onNa(
          KeyBasedVerificationPolicy.CREATE_POLICY_WO_INTERNAL_POLICY()
        )
      ),
      'DefaultVerificationPolicy'
    );
  }
}
