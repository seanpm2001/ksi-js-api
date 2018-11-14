import {HashAlgorithm} from 'gt-js-common';
import {AGGREGATION_HASH_CHAIN_CONSTANTS} from '../../../Constants';
import {RawTag} from '../../../parser/RawTag';
import {TlvOutputStream} from '../../../parser/TlvOutputStream';
import {AggregationHashChain, AggregationHashChainLinkMetaData} from '../../AggregationHashChain';
import {KsiSignature} from '../../KsiSignature';
import {VerificationContext} from '../VerificationContext';
import {VerificationError} from '../VerificationError';
import {VerificationResult, VerificationResultCode} from '../VerificationResult';
import {VerificationRule} from '../VerificationRule';
import {compareTypedArray} from '../../../util/Array';

/**
 * Rule verifies if all metadata tags in aggregation hash chains are valid.
 */
export class AggregationHashChainMetadataRule extends VerificationRule {
    public async verify(context: VerificationContext): Promise<VerificationResult> {
        const signature: KsiSignature = context.getSignature();
        const aggregationHashChains: AggregationHashChain[] = signature.getAggregationHashChains();

        for (const chain of aggregationHashChains) {
            for (const link of chain.getChainLinks()) {
                const metadata: AggregationHashChainLinkMetaData | null = link.getMetadata();

                if (metadata === null) {
                    continue;
                }

                const paddingTag: RawTag | null = metadata.getPaddingTag();
                if (paddingTag === null) {
                    const metadataBytes: Uint8Array = metadata.getValueBytes();
                    if (metadataBytes.length === 0) {
                        continue;
                    }

                    const hashAlgorithmId: number = metadataBytes[0];
                    if (HashAlgorithm.isInvalidAlgorithm(hashAlgorithmId)) {
                        continue;
                    }

                    const hashAlgorithm: HashAlgorithm | null = HashAlgorithm.getById(hashAlgorithmId);
                    if (hashAlgorithm !== null && hashAlgorithm.length === metadataBytes.length - 1) {
                        console.debug(`Metadata without padding may not be trusted. Metadata: ${metadata}.`);

                        return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_11);
                    }
                } else {

                    if (metadata.value.indexOf(paddingTag) !== 0) {
                        console.debug(`Metadata with padding may not be trusted. Padding is not the first element. Metadata: ${metadata}.`);

                        return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_11);
                    }

                    if (paddingTag.tlv16BitFlag) {
                        console.debug(`Metadata with padding may not be trusted. Padding is not TLV8. Metadata: ${metadata}.`);

                        return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_11);
                    }

                    if (!paddingTag.nonCriticalFlag || !paddingTag.forwardFlag) {
                        // tslint:disable-next-line:max-line-length
                        console.debug(`Metadata with padding may not be trusted. Non-critical and forward flags must be set. Metadata: ${metadata}.`);

                        return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_11);
                    }

                    if (!compareTypedArray(paddingTag.getValueBytes(), AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.PaddingKnownValueEven)
                        && !compareTypedArray(paddingTag.getValueBytes(), AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.PaddingKnownValueOdd)) {
                        console.debug(`Metadata with padding may not be trusted. Unknown padding value. Metadata: ${metadata}.`);

                        return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_11);
                    }

                    const stream: TlvOutputStream = new TlvOutputStream();
                    stream.writeTag(metadata);
                    if (stream.getData().length % 2 !== 0) {
                        console.debug(`Metadata with padding may not be trusted. Invalid padding value. Metadata: ${metadata}.`);

                        return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_11);
                    }
                }
            }
        }

        return new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
    }
}
