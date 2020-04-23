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

import HMAC from '@guardtime/common/lib/crypto/HMAC';
import DataHash from '@guardtime/common/lib/hash/DataHash';
import HashAlgorithm from '@guardtime/common/lib/hash/HashAlgorithm';
import { PDU_CONSTANTS, PDU_HEADER_CONSTANTS } from '../Constants';
import { CompositeTag } from '../parser/CompositeTag';
import { ImprintTag } from '../parser/ImprintTag';
import { TlvError } from '../parser/TlvError';
import { TlvInputStream } from '../parser/TlvInputStream';
import { TlvTag } from '../parser/TlvTag';
import { ErrorPayload } from './ErrorPayload';
import { PduHeader } from './PduHeader';
import { PduPayload } from './PduPayload';

/**
 * PDU base classs
 */
export abstract class Pdu extends CompositeTag {
  protected payloads: PduPayload[] = [];
  protected errorPayload: ErrorPayload | null = null;
  private header: PduHeader;
  private hmac: ImprintTag;

  protected constructor(tlvTag: TlvTag) {
    super(tlvTag);
  }

  protected static async CREATE_PDU(
    tagType: number,
    header: PduHeader,
    payload: PduPayload,
    algorithm: HashAlgorithm,
    key: Uint8Array
  ): Promise<TlvTag> {
    const pduBytes: Uint8Array = CompositeTag.CREATE_FROM_LIST(tagType, false, false, [
      header,
      payload,
      ImprintTag.CREATE(
        PDU_CONSTANTS.MacTagType,
        false,
        false,
        DataHash.create(algorithm, new Uint8Array(algorithm.length))
      )
    ]).encode();
    pduBytes.set(
      await HMAC.digest(algorithm, key, pduBytes.slice(0, -algorithm.length)),
      pduBytes.length - algorithm.length
    );

    return new TlvInputStream(pduBytes).readTag();
  }

  public async verifyHmac(algorithm: HashAlgorithm, key: Uint8Array): Promise<boolean> {
    const pduBytes = this.encode();
    const pduHmac = this.hmac.getValue();
    const calculatedHmac = DataHash.create(
      algorithm,
      await HMAC.digest(algorithm, key, pduBytes.slice(0, -algorithm.length))
    );
    return pduHmac.equals(calculatedHmac);
  }

  public getErrorPayload(): ErrorPayload | null {
    return this.errorPayload;
  }

  public getPayloads(): PduPayload[] {
    return this.payloads;
  }

  protected parseChild(tlvTag: TlvTag): TlvTag {
    switch (tlvTag.id) {
      case PDU_HEADER_CONSTANTS.TagType:
        return (this.header = new PduHeader(tlvTag));
      case PDU_CONSTANTS.MacTagType:
        return (this.hmac = new ImprintTag(tlvTag));
      default:
        return this.validateUnknownTlvTag(tlvTag);
    }
  }

  protected validate(): void {
    if (this.errorPayload != null) {
      return;
    }

    if (this.payloads.length === 0) {
      throw new TlvError('Payloads are missing in PDU.');
    }
    if (this.getCount(PDU_HEADER_CONSTANTS.TagType) !== 1) {
      throw new TlvError('Exactly one header must exist in PDU.');
    }
    if (this.value[0] !== this.header) {
      throw new TlvError('Header must be the first element in PDU.');
    }
    if (this.getCount(PDU_CONSTANTS.MacTagType) !== 1) {
      throw new TlvError('Exactly one MAC must exist in PDU.');
    }
    if (this.value[this.value.length - 1] !== this.hmac) {
      throw new TlvError('MAC must be the last element in PDU.');
    }
  }
}
