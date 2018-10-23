var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import bigInteger from 'big-integer';
import { DataHash, pseudoRandomLong } from 'gt-js-common';
import { TlvInputStream } from '../parser/TlvInputStream';
import { KsiSignature } from '../signature/KsiSignature';
import { AggregationRequestPayload } from './AggregationRequestPayload';
import { AggregationRequestPdu } from './AggregationRequestPdu';
import { AggregationResponsePayload } from './AggregationResponsePayload';
import { AggregationResponsePdu } from './AggregationResponsePdu';
import { isIServiceCredentials } from './IServiceCredentials';
import { KsiRequest } from './KsiRequest';
import { KsiServiceError } from './KsiServiceError';
import { PduHeader } from './PduHeader';
import { SigningServiceProtocol } from './SigningServiceProtocol';
/**
 * Signing service
 */
export class SigningService {
    constructor(signingServiceProtocol, signingServiceCredentials) {
        this.requests = {};
        if (!(signingServiceProtocol instanceof SigningServiceProtocol)) {
            throw new KsiServiceError(`Invalid signing service protocol: ${signingServiceProtocol}`);
        }
        if (!isIServiceCredentials(signingServiceCredentials)) {
            throw new KsiServiceError(`Invalid signing service credentials: ${signingServiceCredentials}`);
        }
        this.signingServiceProtocol = signingServiceProtocol;
        this.signingServiceCredentials = signingServiceCredentials;
    }
    static processPayload(payload) {
        if (!(payload instanceof AggregationResponsePayload)) {
            throw new KsiServiceError(`Invalid AggregationResponsePayload: ${payload}`);
        }
        if (payload.getStatus().neq(0)) {
            // tslint:disable-next-line:max-line-length
            throw new KsiServiceError(`Server responded with error message. Status: ${payload.getStatus()}; Message: ${payload.getErrorMessage()}.`);
        }
        return KsiSignature.CREATE(payload);
    }
    sign(hash, level = bigInteger(0)) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(hash instanceof DataHash)) {
                throw new KsiServiceError(`Invalid hash: ${hash}`);
            }
            if (!bigInteger.isInstance(level)) {
                throw new KsiServiceError(`Invalid level: ${level}, must be BigInteger`);
            }
            const header = PduHeader.CREATE_FROM_LOGIN_ID(this.signingServiceCredentials.getLoginId());
            const requestId = pseudoRandomLong();
            const requestPayload = AggregationRequestPayload.CREATE(requestId, hash, level);
            const requestPdu = yield AggregationRequestPdu.CREATE(header, requestPayload, this.signingServiceCredentials.getHmacAlgorithm(), this.signingServiceCredentials.getLoginKey());
            const ksiRequest = new KsiRequest(requestPdu.encode());
            this.requests[requestId.toString()] = ksiRequest;
            const responseBytes = yield this.signingServiceProtocol.sign(ksiRequest);
            if (ksiRequest.getAbortSignal().aborted) {
                return SigningService.processPayload(ksiRequest.getResponsePdu());
            }
            const stream = new TlvInputStream(responseBytes);
            const responsePdu = new AggregationResponsePdu(stream.readTag());
            if (stream.getPosition() < stream.getLength()) {
                throw new KsiServiceError(`Response contains more bytes than PDU length`);
            }
            const errorPayload = responsePdu.getErrorPayload();
            if (errorPayload !== null) {
                if (responsePdu.getPayloads().length > 0) {
                    throw new KsiServiceError(`PDU contains unexpected response payloads!\nPDU:\n${responsePdu}`);
                }
                // tslint:disable-next-line:max-line-length
                throw new KsiServiceError(`Server responded with error message. Status: ${errorPayload.getStatus()}; Message: ${errorPayload.getErrorMessage()}.`);
            }
            let currentAggregationPayload = null;
            for (const responsePayload of responsePdu.getPayloads()) {
                const aggregationPayload = responsePayload;
                const payloadRequestId = aggregationPayload.getRequestId().toString();
                if (!this.requests.hasOwnProperty(payloadRequestId)) {
                    throw new KsiServiceError('Aggregation response request ID does not match any request id which is sent!');
                }
                const request = this.requests[payloadRequestId];
                delete this.requests[payloadRequestId];
                if (payloadRequestId !== requestId.toString()) {
                    request.abort(aggregationPayload);
                    continue;
                }
                if (currentAggregationPayload !== null) {
                    throw new KsiServiceError('Multiple aggregation responses in single PDU.');
                }
                currentAggregationPayload = aggregationPayload;
            }
            return SigningService.processPayload(currentAggregationPayload);
        });
    }
}