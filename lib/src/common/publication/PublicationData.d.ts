import bigInteger, { BigInteger } from 'big-integer';
import { DataHash } from '@guardtime/gt-js-common';
import { CompositeTag } from '../parser/CompositeTag';
import { TlvTag } from '../parser/TlvTag';
/**
 * Publication Data TLV object
 */
export declare class PublicationData extends CompositeTag {
    private publicationTime;
    private publicationHash;
    constructor(tlvTag: TlvTag);
    static CREATE(publicationTime: BigInteger, publicationHash: DataHash): PublicationData;
    static CREATE_FROM_PUBLICATION_STRING(publicationString: string): PublicationData;
    getPublicationHash(): DataHash;
    getPublicationTime(): bigInteger.BigInteger;
    private parseChild;
    private validate;
}
