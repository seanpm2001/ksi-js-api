import {BigInteger} from 'big-integer';
import {compareArrayEquals} from '../../../util/Array';
import {AggregationHashChain} from '../../AggregationHashChain';
import {KsiSignature} from '../../KsiSignature';
import {VerificationContext} from '../VerificationContext';
import {VerificationError} from '../VerificationError';
import {VerificationResult, VerificationResultCode} from '../VerificationResult';
import {VerificationRule} from '../VerificationRule';

/**
 * This rule checks that chain index of a aggregation hash chain is successor to it's parent aggregation hash chain index.
 */
export class AggregationHashChainIndexSuccessorRule extends VerificationRule {
    public async verify(context: VerificationContext): Promise<VerificationResult> {
        const signature: KsiSignature = context.getSignature();
        const aggregationHashChains: AggregationHashChain[] = signature.getAggregationHashChains();

        let parentChainIndex: BigInteger[] | null = null;
        for (const chain of aggregationHashChains) {
            const chainIndex: BigInteger[] = chain.getChainIndex();
            if (parentChainIndex !== null && (parentChainIndex.length <= chainIndex.length
                || !compareArrayEquals(parentChainIndex.slice(0, chainIndex.length), chainIndex))) {

                // tslint:disable-next-line:max-line-length
                console.debug(`Chain index is not the successor to the parent aggregation hash chain index. Chain index: ${chainIndex}; Parent chain index: ${parentChainIndex}.`);

                return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_12);
            }

            parentChainIndex = chainIndex;
        }

        if (aggregationHashChains[aggregationHashChains.length - 1].getChainIndex().length !== 1) {
            // tslint:disable-next-line:max-line-length
            console.debug(`Highest aggregation hash chain index length is not 1. Chain index: ${aggregationHashChains[aggregationHashChains.length - 1].getChainIndex()}.`);

            return new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_12);
        }

        return new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
    }
}
