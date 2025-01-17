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

import { HexCoder } from '@guardtime/common/lib/coders/HexCoder.js';
import { DataHash } from '@guardtime/common/lib/hash/DataHash.js';
import { Utf8Converter } from '@guardtime/common/lib/strings/Utf8Converter.js';
import bigInteger, { BigInteger } from 'big-integer';
import { CastingContext, ColumnOption, parse as parseCsv } from 'csv-parse/dist/esm/sync.js';
import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { default as ksiConfig } from '../config/ksi-config.js';
import {
  ExtendingService,
  KeyBasedVerificationPolicy,
  KsiService,
  PublicationBasedVerificationPolicy,
  PublicationsFileFactory,
  PublicationsFileService,
  ServiceCredentials,
  SigningService,
  VerificationContext,
} from '../src/common/main';
import {
  ExtendingServiceProtocol,
  PublicationsFileServiceProtocol,
  SigningServiceProtocol,
} from '../src/common/main.js';
import { TlvInputStream } from '../src/common/parser/TlvInputStream.js';
import { PublicationData } from '../src/common/publication/PublicationData.js';
import { PublicationsFile } from '../src/common/publication/PublicationsFile.js';
import { IExtendingServiceProtocol } from '../src/common/service/IExtendingServiceProtocol.js';
import { IServiceCredentials } from '../src/common/service/IServiceCredentials.js';
import { KsiSignature } from '../src/common/signature/KsiSignature.js';
import { CalendarBasedVerificationPolicy } from '../src/common/signature/verification/policy/CalendarBasedVerificationPolicy.js';
import { InternalVerificationPolicy } from '../src/common/signature/verification/policy/InternalVerificationPolicy.js';
import { VerificationPolicy } from '../src/common/signature/verification/policy/VerificationPolicy.js';
import { VerificationError } from '../src/common/signature/verification/VerificationError.js';
import { VerificationResult } from '../src/common/signature/verification/VerificationResult.js';
import { TestServiceProtocol } from '../test/service/TestServiceProtocol.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: {
  testDirectory: null | string;
  ksiService: null | KsiService;
  publicationsFile: PublicationsFile | null;
} = {
  publicationsFile: null,
  testDirectory: null,
  ksiService: null,
};

type SignatureTestRow = {
  signatureFile: string;
  actionName: string;
  errorCode: string;
  errorMessage: string;
  inputHashLevel: BigInteger;
  inputHash: DataHash | null;
  calendarHashChainInput: DataHash | null;
  calendarHashChainOutput: DataHash | null;
  aggregationTime: BigInteger | null;
  publicationTime: BigInteger | null;
  publicationData: PublicationData | null;
  isExtendingAllowed: boolean;
  resourceFile: string;
  publicationsFilePath: string;
  certFilePath: string;
  rowIndex: number;
};

type CsvCastTypes = string | BigInteger | DataHash | PublicationData | number | boolean | null;

/**
 * Test extending service to mock request id
 */
class TestExtendingService extends ExtendingService {
  private readonly requestId: BigInteger;

  public constructor(
    extendingServiceProtocol: IExtendingServiceProtocol,
    extendingServiceCredentials: IServiceCredentials,
    requestId: BigInteger
  ) {
    super(extendingServiceProtocol, extendingServiceCredentials);
    this.requestId = requestId;
  }

  protected generateRequestId(): BigInteger {
    return this.requestId;
  }
}

async function testSignature(row: SignatureTestRow, testBasePath: string): Promise<void> {
  const signatureBytes: Uint8Array = new Uint8Array(fs.readFileSync(path.join(testBasePath, row.signatureFile)));
  let policy: VerificationPolicy;
  let userPublication: PublicationData | null = null;

  switch (row.actionName.toUpperCase()) {
    case 'USERPUBLICATION':
      userPublication = row.publicationData;
      policy = new PublicationBasedVerificationPolicy();
      break;
    case 'PUBLICATIONSFILE':
      policy = new PublicationBasedVerificationPolicy();
      break;
    case 'KEY':
      policy = new KeyBasedVerificationPolicy();
      break;
    case 'INTERNAL':
      policy = new InternalVerificationPolicy();
      break;
    case 'CALENDAR':
      policy = new CalendarBasedVerificationPolicy();
      break;
    case 'PARSING':
      expect(() => {
        return new KsiSignature(new TlvInputStream(signatureBytes).readTag());
      }).toThrow();

      return;
    case 'NOT-IMPLEMENTED':
      return;
    default:
      throw new Error(`Unknown testing action: ${row.actionName}`);
  }

  const verificationContext: VerificationContext = new VerificationContext(
    new KsiSignature(new TlvInputStream(signatureBytes).readTag())
  );

  verificationContext.setDocumentHash(row.inputHash);
  verificationContext.setUserPublication(row.publicationData);
  verificationContext.setKsiService(config.ksiService);
  verificationContext.setDocumentHashLevel(row.inputHashLevel);
  verificationContext.setExtendingAllowed(row.isExtendingAllowed);

  let certFile;
  if (row.certFilePath) {
    certFile = Utf8Converter.ToString(fs.readFileSync(path.join(testBasePath, row.certFilePath)));
  }

  if (userPublication === null) {
    if (!row.publicationsFilePath) {
      verificationContext.setPublicationsFile(config.publicationsFile);
    } else {
      verificationContext.setPublicationsFile(
        new PublicationsFileFactory(certFile).create(
          new Uint8Array(fs.readFileSync(path.join(testBasePath, row.publicationsFilePath)))
        )
      );
    }
  }

  if (row.resourceFile) {
    verificationContext.setKsiService(
      new KsiService(
        new SigningService(
          new TestServiceProtocol(fs.readFileSync(path.join(testBasePath, row.resourceFile))),
          new ServiceCredentials(ksiConfig.LOGIN_ID, ksiConfig.LOGIN_KEY)
        ),
        new TestExtendingService(
          new TestServiceProtocol(fs.readFileSync(path.join(testBasePath, row.resourceFile))),
          new ServiceCredentials(ksiConfig.LOGIN_ID, ksiConfig.LOGIN_KEY),
          bigInteger(1)
        ),
        new PublicationsFileService(
          new TestServiceProtocol(fs.readFileSync(path.join(testBasePath, row.resourceFile))),
          new PublicationsFileFactory(certFile)
        )
      )
    );
  } else {
    verificationContext.setKsiService(config.ksiService);
  }

  console.debug(verificationContext.getSignature().toString());
  const result: VerificationResult = await policy.verify(verificationContext);
  const verificationError: VerificationError | null = result.getVerificationError();
  console.debug(result.toString());
  if (verificationError) {
    expect(verificationError.code).toEqual(row.errorCode);
    expect(verificationError.message).toEqual(row.errorMessage);
  }
}

/**
 * Signature Test Pack for shared tests over all SDK-s
 */
describe.each([
  path.join(__dirname, './resources/signature-test-pack/internal-policy-signatures/internal-policy-results.csv'),
  path.join(__dirname, './resources/signature-test-pack/invalid-signatures/invalid-signature-results.csv'),
  path.join(
    __dirname,
    './resources/signature-test-pack/policy-verification-signatures/policy-verification-results.csv'
  ),
  path.join(__dirname, './resources/signature-test-pack/valid-signatures/signature-results.csv'),
])('Signature Test Pack: %s', (resultFile: string): void => {
  beforeAll(() => {
    config.ksiService = new KsiService(
      new SigningService(
        new SigningServiceProtocol(ksiConfig.AGGREGATION_URL),
        new ServiceCredentials(ksiConfig.LOGIN_ID, ksiConfig.LOGIN_KEY)
      ),
      new ExtendingService(
        new ExtendingServiceProtocol(ksiConfig.EXTENDER_URL),
        new ServiceCredentials(ksiConfig.LOGIN_ID, ksiConfig.LOGIN_KEY)
      ),
      new PublicationsFileService(
        new PublicationsFileServiceProtocol(ksiConfig.PUBLICATIONS_FILE_URL),
        new PublicationsFileFactory()
      )
    );

    return config.ksiService.getPublicationsFile().then((publicationsFile: PublicationsFile) => {
      config.publicationsFile = publicationsFile;
    });
  });

  it.each(
    (
      parseCsv(fs.readFileSync(resultFile).toString(), {
        from_line: 2,
        delimiter: ';',
        columns: (): ColumnOption[] => {
          return [
            'signatureFile',
            'actionName',
            'errorCode',
            'errorMessage',
            'inputHashLevel',
            'inputHash',
            'calendarHashChainInput',
            'calendarHashChainOutput',
            'aggregationTime',
            'publicationTime',
            'publicationData',
            'isExtendingAllowed',
            'resourceFile',
            'publicationsFilePath',
            'certFilePath',
            'rowIndex',
          ];
        },
        cast: (value: string, context: CastingContext): CsvCastTypes => {
          if (context.lines === 0) {
            return false;
          }

          switch (context.index) {
            case 4:
              return value ? bigInteger(value, 10) : bigInteger(0);
            case 5:
            case 6:
            case 7:
              return value ? new DataHash(HexCoder.decode(value)) : null;
            case 8:
            case 9:
              return value ? bigInteger(value, 10) : null;
            case 10:
              return value ? PublicationData.CREATE_FROM_PUBLICATION_STRING(value) : null;
            case 11:
              return value.toUpperCase() === 'TRUE';
            case 15:
              return context.lines;
            default:
              return value;
          }
        },
      }) as SignatureTestRow[]
    ).map((row: SignatureTestRow) => [path.basename(row.signatureFile), row])
  )('%s', (filename: string, row: SignatureTestRow) => {
    console.debug(`
SignatureFile: ${row.signatureFile}
ActionName:    ${row.actionName}
Error Code:    ${row.errorCode}
Error Message: ${row.errorMessage}
Row index:     ${row.rowIndex}`);

    return testSignature(row, path.dirname(resultFile));
  });
});
