import bigInteger from 'big-integer';

import {PUBLICATIONS_FILE_HEADER_CONSTANTS} from '../../src/common/Constants';
import {CompositeTag} from '../../src/common/parser/CompositeTag';
import {IntegerTag} from '../../src/common/parser/IntegerTag';
import {StringTag} from '../../src/common/parser/StringTag';
import {PublicationsFileHeader} from '../../src/common/publication/PublicationsFileHeader';

/**
 * Certificate record TLV tag tests
 */
describe('PublicationsFileHeader', () => {
    it('Creation with TlvTag', () => {
        const publicationsFileHeader: PublicationsFileHeader = new PublicationsFileHeader(
            CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
                IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
                IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
                StringTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType, false, false, 'http://localhost/test')
            ]));

        expect(publicationsFileHeader.getVersion()).toEqual(bigInteger(5));
        expect(publicationsFileHeader.getCreationTime()).toEqual(bigInteger(1));
        expect(publicationsFileHeader.getRepositoryUri()).toEqual('http://localhost/test');
    });

    it('Creation with missing repository uri', () => {
        const publicationsFileHeader: PublicationsFileHeader = new PublicationsFileHeader(
            CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
                IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
                IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1))
            ]));

        expect(publicationsFileHeader.getRepositoryUri()).toEqual(null);
    });

    it('Creation with missing version', () => {
        expect(() => {
            return new PublicationsFileHeader(
                CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1))
                ]));
        }).toThrow('Exactly one version must exist in publications file header.');
    });

    it('Creation with missing creation time', () => {
        expect(() => {
            return new PublicationsFileHeader(
                CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5))
                ]));
        }).toThrow('Exactly one creation time must exist in publications file header.');
    });

    it('Creation with multiple version', () => {
        expect(() => {
            return new PublicationsFileHeader(
                CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(6)),
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1))
                ]));
        }).toThrow('Exactly one version must exist in publications file header.');
    });

    it('Creation with multiple creation time', () => {
        expect(() => {
            return new PublicationsFileHeader(
                CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(2))
                ]));
        }).toThrow('Exactly one creation time must exist in publications file header.');
    });

    it('Creation with multiple creation time', () => {
        expect(() => {
            return new PublicationsFileHeader(
                CompositeTag.CREATE_FROM_LIST(PUBLICATIONS_FILE_HEADER_CONSTANTS.TagType, false, false, [
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.VersionTagType, false, false, bigInteger(5)),
                    IntegerTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.CreationTimeTagType, false, false, bigInteger(1)),
                    StringTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType, false, false, 'http://localhost/test'),
                    StringTag.CREATE(PUBLICATIONS_FILE_HEADER_CONSTANTS.RepositoryUriTagType, false, false, 'http://localhost/broken')
                ]));
        }).toThrow('Only one repository uri is allowed in publications file header.');
    });
});