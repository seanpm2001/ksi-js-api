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
import { HashAlgorithm } from '@guardtime/common/lib/hash/HashAlgorithm.js';
import bigInteger from 'big-integer';

import {
  CERTIFICATE_RECORD_CONSTANTS,
  PUBLICATIONS_FILE_CONSTANTS,
  PUBLICATIONS_FILE_HEADER_CONSTANTS,
} from '../../src/common/Constants.js';
import { CompositeTag } from '../../src/common/parser/CompositeTag.js';
import { IntegerTag } from '../../src/common/parser/IntegerTag.js';
import { RawTag } from '../../src/common/parser/RawTag.js';
import { StringTag } from '../../src/common/parser/StringTag.js';
import { TlvOutputStream } from '../../src/common/parser/TlvOutputStream.js';
import { CertificateRecord } from '../../src/common/publication/CertificateRecord.js';
import { PublicationData } from '../../src/common/publication/PublicationData.js';
import { PublicationRecord } from '../../src/common/publication/PublicationRecord.js';
import { PublicationsFile } from '../../src/common/publication/PublicationsFile.js';
import { PublicationsFileHeader } from '../../src/common/publication/PublicationsFileHeader.js';
import { TestPublicationsFileFactory } from './TestPublicationsFileFactory';

/**
 * Certificate record TLV tag tests
 */
describe('PublicationsFile', () => {
  it('Creation with bytes', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);
    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );

    stream.writeTag(
      new CertificateRecord(
        CompositeTag.CREATE_FROM_LIST(CERTIFICATE_RECORD_CONSTANTS.TagType, false, false, [
          RawTag.CREATE(
            CERTIFICATE_RECORD_CONSTANTS.CertificateIdTagType,
            false,
            false,
            new Uint8Array([0x0, 0x1, 0x2])
          ),
          RawTag.CREATE(
            CERTIFICATE_RECORD_CONSTANTS.X509CertificateTagType,
            false,
            false,
            new Uint8Array([0x3, 0x4, 0x5])
          ),
        ])
      )
    );

    stream.writeTag(
      new CertificateRecord(
        CompositeTag.CREATE_FROM_LIST(CERTIFICATE_RECORD_CONSTANTS.TagType, false, false, [
          RawTag.CREATE(
            CERTIFICATE_RECORD_CONSTANTS.CertificateIdTagType,
            false,
            false,
            new Uint8Array([0x6, 0x7, 0x8])
          ),
          RawTag.CREATE(
            CERTIFICATE_RECORD_CONSTANTS.X509CertificateTagType,
            false,
            false,
            new Uint8Array([0x1, 0x2, 0x3])
          ),
        ])
      )
    );

    stream.writeTag(
      new PublicationRecord(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_CONSTANTS.PublicationRecordTagType, false, false, [
          PublicationData.CREATE(bigInteger(1), DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))),
        ])
      )
    );

    stream.writeTag(
      new PublicationRecord(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_CONSTANTS.PublicationRecordTagType, false, false, [
          PublicationData.CREATE(bigInteger(2), DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32).fill(1))),
        ])
      )
    );

    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    const publicationsFile: PublicationsFile = new TestPublicationsFileFactory().create(stream.getData());
    expect(publicationsFile.getSignatureValue()).toEqual(new Uint8Array([0x1, 0x2]));
    expect(publicationsFile.getSignedBytes()).toEqual(
      HexCoder.decode(
        '4B53495055424C468701001E0101050201010316687474703A2F2F6C6F63616C686F73742F74657374008702000A01030001020203030405870200' +
          '0A010306070802030102038703002810260201010421010000000000000000000000000000000000000000000000000000000000000000870300281026' +
          '0201020421010101010101010101010101010101010101010101010101010101010101010101'
      )
    );

    expect((publicationsFile.getLatestPublication() as PublicationRecord).getPublicationTime()).toEqual(bigInteger(2));
    expect((publicationsFile.getLatestPublication() as PublicationRecord).getPublicationHash()).toEqual(
      DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32).fill(1))
    );

    expect(
      (publicationsFile.getNearestPublicationRecord(bigInteger(0)) as PublicationRecord).getPublicationTime()
    ).toEqual(bigInteger(1));
    expect(
      (publicationsFile.getNearestPublicationRecord(bigInteger(0)) as PublicationRecord).getPublicationHash()
    ).toEqual(DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32)));

    expect(
      (publicationsFile.findCertificateById(new Uint8Array([0x0, 0x1, 0x2])) as CertificateRecord).getX509Certificate()
    ).toEqual(new Uint8Array([0x3, 0x4, 0x5]));
    expect(
      (publicationsFile.findCertificateById(new Uint8Array([0x6, 0x7, 0x8])) as CertificateRecord).getX509Certificate()
    ).toEqual(new Uint8Array([0x1, 0x2, 0x3]));
  });

  it('Creation without records', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);
    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );

    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    const publicationsFile: PublicationsFile = new TestPublicationsFileFactory().create(stream.getData());

    expect(publicationsFile.getLatestPublication()).toEqual(null);
  });

  it('Creation with only publication record', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);
    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );

    stream.writeTag(
      new PublicationRecord(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_CONSTANTS.PublicationRecordTagType, false, false, [
          PublicationData.CREATE(bigInteger(2), DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32).fill(1))),
        ])
      )
    );

    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    const publicationsFile: PublicationsFile = new TestPublicationsFileFactory().create(stream.getData());

    expect((publicationsFile.getLatestPublication() as PublicationRecord).getPublicationTime()).toEqual(bigInteger(2));
    expect((publicationsFile.getLatestPublication() as PublicationRecord).getPublicationHash()).toEqual(
      DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32).fill(1))
    );
  });

  it('Creation without magic bytes', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );

    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    expect(() => {
      return new TestPublicationsFileFactory().create(stream.getData());
    }).toThrow('Publications file header is incorrect. Invalid publications file magic bytes.');
  });

  it('Creation without header', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);
    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    expect(() => {
      return new TestPublicationsFileFactory().create(stream.getData());
    }).toThrow('Exactly one publications file header must exist in publications file.');
  });

  it('Creation without CMS signature', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);
    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );

    expect(() => {
      return new TestPublicationsFileFactory().create(stream.getData());
    }).toThrow('Exactly one signature must exist in publications file.');
  });

  it('Creation with multiple header', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);
    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );
    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );
    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    expect(() => {
      return new TestPublicationsFileFactory().create(stream.getData());
    }).toThrow('Exactly one publications file header must exist in publications file.');
  });

  it('Creation with multiple CMS signature', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);
    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );
    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );
    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    expect(() => {
      return new TestPublicationsFileFactory().create(stream.getData());
    }).toThrow('Exactly one signature must exist in publications file.');
  });

  it('Creation with header being second element', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);
    stream.writeTag(
      new CertificateRecord(
        CompositeTag.CREATE_FROM_LIST(CERTIFICATE_RECORD_CONSTANTS.TagType, false, false, [
          RawTag.CREATE(
            CERTIFICATE_RECORD_CONSTANTS.CertificateIdTagType,
            false,
            false,
            new Uint8Array([0x0, 0x1, 0x2])
          ),
          RawTag.CREATE(
            CERTIFICATE_RECORD_CONSTANTS.X509CertificateTagType,
            false,
            false,
            new Uint8Array([0x3, 0x4, 0x5])
          ),
        ])
      )
    );

    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );

    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    expect(() => {
      return new TestPublicationsFileFactory().create(stream.getData());
    }).toThrow('Publications file header should be the first element in publications file.');
  });

  it('Creation with signature not last element', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);

    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );

    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    stream.writeTag(
      new PublicationRecord(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_CONSTANTS.PublicationRecordTagType, false, false, [
          PublicationData.CREATE(bigInteger(1), DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))),
        ])
      )
    );

    expect(() => {
      return new TestPublicationsFileFactory().create(stream.getData());
    }).toThrow('Cms signature should be last element in publications file.');
  });

  it('Creation with publication record being before certificate record', () => {
    const stream: TlvOutputStream = new TlvOutputStream();
    stream.write(PublicationsFile.FileBeginningMagicBytes);

    stream.writeTag(
      new PublicationsFileHeader(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
          IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
          StringTag.CREATE(
            PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType,
            false,
            false,
            'http://localhost/test'
          ),
        ])
      )
    );

    stream.writeTag(
      new PublicationRecord(
        CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_CONSTANTS.PublicationRecordTagType, false, false, [
          PublicationData.CREATE(bigInteger(1), DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))),
        ])
      )
    );

    stream.writeTag(
      new CertificateRecord(
        CompositeTag.CREATE_FROM_LIST(CERTIFICATE_RECORD_CONSTANTS.TagType, false, false, [
          RawTag.CREATE(
            CERTIFICATE_RECORD_CONSTANTS.CertificateIdTagType,
            false,
            false,
            new Uint8Array([0x0, 0x1, 0x2])
          ),
          RawTag.CREATE(
            CERTIFICATE_RECORD_CONSTANTS.X509CertificateTagType,
            false,
            false,
            new Uint8Array([0x3, 0x4, 0x5])
          ),
        ])
      )
    );

    stream.writeTag(
      RawTag.CREATE(PUBLICATIONS_FILE_CONSTANTS.CmsSignatureTagType, false, false, new Uint8Array([0x1, 0x2]))
    );

    expect(() => {
      return new TestPublicationsFileFactory().create(stream.getData());
    }).toThrow('Certificate records should be before publication records.');
  });
});
