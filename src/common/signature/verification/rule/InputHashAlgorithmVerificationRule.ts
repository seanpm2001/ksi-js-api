/*
 * GUARDTIME CONFIDENTIAL
 *
 * Copyright 2008-2020 Guardtime, Inc.
 * All Rights Reserved.
 *
 * All information contained herein is, and remains, the property
 * of Guardtime, Inc. and its suppliers, if any.
 * The intellectual and technical concepts contained herein are
 * proprietary to Guardtime, Inc. and its suppliers and may be
 * covered by U.S. and foreign patents and patents in process,
 * and/or are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Guardtime, Inc.
 * "Guardtime" and "KSI" are trademarks or registered trademarks of
 * Guardtime, Inc., and no license to trademarks is granted; Guardtime
 * reserves and retains all trademark rights.
 */

import {DataHash} from '@guardtime/gt-js-common';
import {KsiSignature} from '../../KsiSignature';
import {VerificationContext} from '../VerificationContext';
import {VerificationError} from '../VerificationError';
import {VerificationResult, VerificationResultCode} from '../VerificationResult';
import {VerificationRule} from '../VerificationRule';

/**
 * This rule verifies input hash algorithm. If RFC3161 record is present then intput hash algorithm must equal
 * to RFC3161 record input hash algorithm. Otherwise input hash algorithm is compared to aggregation hash chain input hash algorithm.
 * If input hash is not provided then <see cref="VerificationResultCode.Ok" /> is returned.
 */
export class InputHashAlgorithmVerificationRule extends VerificationRule {
    constructor() {
        super('InputHashAlgorithmVerificationRule');
    }

    public async verify(context: VerificationContext): Promise<VerificationResult> {
        const signature: KsiSignature = context.getSignature();
        const documentHash: DataHash | null = context.getDocumentHash();

        if (documentHash === null) {
            return new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
        }

        const inputHash: DataHash = signature.getInputHash();

        if (documentHash.hashAlgorithm !== inputHash.hashAlgorithm) {
            console.debug(`Wrong input hash algorithm. Expected ${documentHash.hashAlgorithm}, found ${inputHash.hashAlgorithm}.`);

            return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.GEN_04());
        }

        return new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
    }
}
