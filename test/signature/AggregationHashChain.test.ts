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

import { AGGREGATION_HASH_CHAIN_CONSTANTS, LinkDirection } from '../../src/common/Constants.js';
import { CompositeTag } from '../../src/common/parser/CompositeTag.js';
import { ImprintTag } from '../../src/common/parser/ImprintTag.js';
import { IntegerTag } from '../../src/common/parser/IntegerTag.js';
import { RawTag } from '../../src/common/parser/RawTag.js';
import { StringTag } from '../../src/common/parser/StringTag.js';
import { TlvTag } from '../../src/common/parser/TlvTag.js';
import { AggregationHashChain, AggregationHashChainLink } from '../../src/common/signature/AggregationHashChain.js';
import { IKsiIdentity } from '../../src/common/signature/IKsiIdentity.js';

/**
 * Aggregation hash chain TLV tag tests
 */
describe('AggregationHashChain', () => {
  it('Creation with TlvTag with optional content', async () => {
    const links: TlvTag[] = [
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ];

    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      RawTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputDataTagType,
        false,
        false,
        new Uint8Array([0x74, 0x65, 0x73, 0x74])
      ),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      ...links,
    ]);

    const chain: AggregationHashChain = new AggregationHashChain(tlvTag);

    expect(chain.getIdentity().map((identity: IKsiIdentity) => identity.getClientId())).toEqual(['test', 'me']);
    expect(chain.getChainIndex()).toEqual([bigInteger(1), bigInteger(2)]);
    expect(chain.getAggregationTime()).toEqual(bigInteger(1000));
    expect(JSON.stringify(chain.getChainLinks())).toEqual(
      JSON.stringify(links.map((tag: TlvTag) => new AggregationHashChainLink(tag)))
    );
    expect(chain.getInputHash()).toEqual(
      DataHash.create(
        HashAlgorithm.SHA2_256,
        HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
      )
    );
    expect(chain.getInputData()).toEqual(new Uint8Array([0x74, 0x65, 0x73, 0x74]));
    expect(await chain.getOutputHash({ level: bigInteger(0), hash: chain.getInputHash() })).toEqual({
      level: bigInteger(3),
      hash: DataHash.create(
        HashAlgorithm.SHA2_256,
        HexCoder.decode('E5321A7C33863817393744EDB04A2F8D32CD5801AD88816515125D1162577D4B')
      ),
    });
    expect(chain.getAggregationAlgorithm()).toEqual(HashAlgorithm.SHA2_256);
  });

  it('Creation with TlvTag', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ]);

    const chain: AggregationHashChain = new AggregationHashChain(tlvTag);

    expect(chain.getIdentity().map((identity: IKsiIdentity) => identity.getClientId())).toEqual(['test', 'me']);
    expect(chain.getChainIndex()).toEqual([bigInteger(1), bigInteger(2)]);
    expect(chain.getAggregationTime()).toEqual(bigInteger(1000));
    expect(
      chain
        .getChainLinks()
        .map((link: AggregationHashChainLink) =>
          link.getIdentity() === null ? null : (link.getIdentity() as IKsiIdentity).getClientId()
        )
    ).toEqual(['me', null, 'test']);
    expect(chain.getInputHash()).toEqual(
      DataHash.create(
        HashAlgorithm.SHA2_256,
        HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
      )
    );
    expect(chain.getInputData()).toEqual(null);
    expect(await chain.getOutputHash({ level: bigInteger(0), hash: chain.getInputHash() })).toEqual({
      level: bigInteger(3),
      hash: DataHash.create(
        HashAlgorithm.SHA2_256,
        HexCoder.decode('E5321A7C33863817393744EDB04A2F8D32CD5801AD88816515125D1162577D4B')
      ),
    });
    expect(chain.getAggregationAlgorithm()).toEqual(HashAlgorithm.SHA2_256);
  });

  it('Creation with TlvTag missing aggregation time tag', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ]);

    expect(() => {
      return new AggregationHashChain(tlvTag);
    }).toThrow('Exactly one aggregation time must exist in aggregation hash chain.');
  });

  it('Creation with TlvTag multiple aggregation time tag', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1001)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ]);

    expect(() => {
      return new AggregationHashChain(tlvTag);
    }).toThrow('Exactly one aggregation time must exist in aggregation hash chain.');
  });

  it('Creation with TlvTag missing chain indexes', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ]);

    expect(() => {
      return new AggregationHashChain(tlvTag);
    }).toThrow('Chain index is missing in aggregation hash chain.');
  });

  it('Creation with TlvTag containing multiple input data', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      RawTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputDataTagType,
        false,
        false,
        new Uint8Array([0x74, 0x65, 0x73, 0x74])
      ),
      RawTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputDataTagType,
        false,
        false,
        new Uint8Array([0x74, 0x65, 0x73, 0x74])
      ),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ]);

    expect(() => {
      return new AggregationHashChain(tlvTag);
    }).toThrow('Only one input data value is allowed in aggregation hash chain.');
  });

  it('Creation with TlvTag missing input hash', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ]);

    expect(() => {
      return new AggregationHashChain(tlvTag);
    }).toThrow('Exactly one input hash must exist in aggregation hash chain.');
  });

  it('Creation with TlvTag containing multiple input hash', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ]);

    expect(() => {
      return new AggregationHashChain(tlvTag);
    }).toThrow('Exactly one input hash must exist in aggregation hash chain.');
  });

  it('Creation with TlvTag missing aggregation algorithm', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ]);

    expect(() => {
      return new AggregationHashChain(tlvTag);
    }).toThrow('Exactly one algorithm must exist in aggregation hash chain.');
  });

  it('Creation with TlvTag containing multiple aggregation algorithm', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'me'),
        ]),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        ImprintTag.CREATE(
          AGGREGATION_HASH_CHAIN_CONSTANTS.LINK.SiblingHashTagType,
          false,
          false,
          DataHash.create(HashAlgorithm.SHA2_256, new Uint8Array(32))
        ),
      ]),
      CompositeTag.CREATE_FROM_LIST(LinkDirection.Right, false, false, [
        CompositeTag.CREATE_FROM_LIST(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.TagType, false, false, [
          StringTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.METADATA.ClientIdTagType, false, false, 'test'),
        ]),
      ]),
    ]);

    expect(() => {
      return new AggregationHashChain(tlvTag);
    }).toThrow('Exactly one algorithm must exist in aggregation hash chain.');
  });

  it('Creation with TlvTag missing chain links', async () => {
    const tlvTag: TlvTag = CompositeTag.CREATE_FROM_LIST(LinkDirection.Left, false, false, [
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationTimeTagType, false, false, bigInteger(1000)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(1)),
      IntegerTag.CREATE(AGGREGATION_HASH_CHAIN_CONSTANTS.ChainIndexTagType, false, false, bigInteger(2)),
      ImprintTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.InputHashTagType,
        false,
        false,
        DataHash.create(
          HashAlgorithm.SHA2_256,
          HexCoder.decode('9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08')
        )
      ),
      IntegerTag.CREATE(
        AGGREGATION_HASH_CHAIN_CONSTANTS.AggregationAlgorithmIdTagType,
        false,
        false,
        bigInteger(HashAlgorithm.SHA2_256.id)
      ),
    ]);

    expect(() => {
      return new AggregationHashChain(tlvTag);
    }).toThrow('Links are missing in aggregation hash chain.');
  });
});
