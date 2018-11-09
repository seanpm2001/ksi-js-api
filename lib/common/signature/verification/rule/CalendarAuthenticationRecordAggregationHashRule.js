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
 * Rule verifies that calendar authentication record publication hash equals to calendar hash chain output hash.
 * Without calendar authentication record VerificationResultCode.Ok is returned.
 */
export class CalendarAuthenticationRecordAggregationHashRule extends VerificationRule {
    verify(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const signature = context.getSignature();
            const calendarAuthenticationRecord = signature.getCalendarAuthenticationRecord();
            if (calendarAuthenticationRecord == null) {
                return new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
            }
            const calendarHashChain = signature.getCalendarHashChain();
            if (calendarHashChain === null) {
                throw new KsiVerificationError('Calendar hash chain is missing from KSI signature.');
            }
            return !(yield calendarHashChain.calculateOutputHash())
                .equals(calendarAuthenticationRecord.getPublicationData().getPublicationHash())
                ? new VerificationResult(this.getRuleName(), VerificationResultCode.FAIL, VerificationError.INT_08)
                : new VerificationResult(this.getRuleName(), VerificationResultCode.OK);
        });
    }
}