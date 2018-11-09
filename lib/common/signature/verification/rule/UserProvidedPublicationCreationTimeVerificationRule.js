var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { KsiVerificationError } from '../KsiVerificationError';
import { VerificationError } from '../VerificationError';
import { VerificationResult, VerificationResultCode } from '../VerificationResult';
import { VerificationRule } from '../VerificationRule';
/**
 * Rule checks that signature is created before user provided publication.
 */
export class UserProvidedPublicationCreationTimeVerificationRule extends VerificationRule {
    verify(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const aggregationTime = context.getSignature().getAggregationTime();
            const userPublication = context.getUserPublication();
            if (userPublication == null) {
                throw new KsiVerificationError('Invalid user publication in context: null.');
            }
            const userPublicationTime = userPublication.getPublicationTime();
            return aggregationTime.geq(userPublicationTime)
                ? new VerificationResult(this.getRuleName(), VerificationResultCode.NA, VerificationError.GEN_02)
                : new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
        });
    }
}