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
 * Rule checks that user provided publication equals to publication in KSI signature.
 */
export class UserProvidedPublicationVerificationRule extends VerificationRule {
    verify(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const signature = context.getSignature();
            const userPublication = context.getUserPublication();
            if (userPublication === null) {
                throw new KsiVerificationError('Invalid user publication in context: null.');
            }
            const publicationRecord = signature.getPublicationRecord();
            if (publicationRecord === null) {
                throw new KsiVerificationError('Invalid publication record in signature: null.');
            }
            if (userPublication.getPublicationTime().neq(publicationRecord.getPublicationTime())) {
                // tslint:disable-next-line:max-line-length
                console.debug(`User provided publication time does not equal to signature publication time. User provided publication time: ${userPublication.getPublicationTime()}; Signature publication time: ${publicationRecord.getPublicationTime()}.`);
                return new VerificationResult(this.getRuleName(), VerificationResultCode.NA, VerificationError.GEN_02);
            }
            return !userPublication.getPublicationHash().equals(publicationRecord.getPublicationHash())
                ? new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.PUB_04)
                : new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
        });
    }
}