/**
 * Extracts, parses, and creates VPK ("Valve PacK") files.
 *
 * VPK is a package format used by post-GCF Source engine
 * games to store content, as well as in Source 2.
 *
 * @note  Only compatible with VPK Version 2 and above.
 * @note  Only supports embedded content.
 * @see   https://developer.valvesoftware.com/wiki/VPK_(file_format)
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import log from 'electron-log';

/** @interface */
interface HeaderV2 {
  /** The header signature */
  Signature: number;

  /** The header version number */
  Version: number;

  /** The size, in bytes, of the directory tree */
  TreeSize: number;

  /** How many bytes of file content are stored in this VPK file (0 in CSGO) */
  FileDataSectionSize: number;

  /** The size, in bytes, of the section containing MD5 checksums for external archive content */
  ArchiveMD5SectionSize: number;

  /** The size, in bytes, of the section containing MD5 checksums for content in this file (should always be 48) */
  OtherMD5SectionSize: number;

  /**
   * The size, in bytes, of the section containing the public key and signature.
   *
   * This is either 0 (CSGO & The Ship) or 296 (HL2, HL2:DM, HL2:EP1, HL2:EP2, HL2:LC, TF2, DOD:S & CS:S)
   */
  SignatureSectionSize: number;
}

/** @interface */
interface DirectoryEntry {
  /** A 32bit CRC of the file's data. */
  CRC: number;

  /** The number of bytes contained in the index file. */
  PreloadBytes: number;

  /**
   * A zero based index of the archive this file's data is contained in.
   *
   * If 0x7fff, the data follows the directory.
   */
  ArchiveIndex: number;

  /**
   * If ArchiveIndex is 0x7fff, the offset of the file data relative to the end of the directory (see the header for more details).
   * Otherwise, the offset of the data from the start of the specified archive.
   */
  EntryOffset: number;

  /**
   * If zero, the entire file is stored in the preload data.
   *
   * Otherwise, the number of bytes stored starting at EntryOffset.
   */
  EntryLength: number;

  /** Always set to 0xffff. */
  Terminator: number;
}

/** @interface */
interface Tree {
  [extension: string]: {
    [directory: string]: {
      [filename: string]: DirectoryEntry;
    };
  };
}

/** @constant */
const ARCHIVE_INDEX_EMBEDDED = 0x7fff;

/** @constant */
const DIRECTORY_ENTRY_SIZE_BYTES = 18;

/** @constant */
const HEADER_SIGNATURE_CSGO = 0x55aa1234;

/** @constant */
const HEADER_SIGNATURE_CS2 = 0x000008f4;

/** @constant */
const HEADER_SIZE_BYTES = 28;

/** @constant */
const HEADER_VERSION_CSGO = 2;

/** @constant */
const HEADER_VERSION_CS2 = 65548;

/** @constant */
const TERMINATOR = 0xffff;

/**
 * Parses the VPK archive.
 *
 * @class
 */
export class Parser {
  /**
   * The loaded VPK file buffer.
   *
   * @constant
   */
  private buffer: Buffer;

  /**
   * In-memory cache of file buffers.
   *
   * @constant
   */
  private files: Record<string, Buffer>;

  /**
   * The loaded VPK header data.
   *
   * @constant
   */
  private header: HeaderV2;

  /**
   * Scoped logging instance.
   *
   * @constant
   */
  private log: log.LogFunctions;

  /**
   * The directory tree.
   *
   * @constant
   */
  private tree: Tree;

  /**
   * The path to the VPK file.
   *
   * @constant
   */
  private vpk: string;

  /**
   * @param vpk The path to the VPK file.
   * @constructor
   */
  constructor(vpk: string) {
    this.files = {};
    this.log = log.scope('vpk');
    this.tree = {};
    this.vpk = vpk;
  }

  /**
   * Builds the header data structure.
   *
   * @function
   */
  private async buildHeader() {
    const treeBuffer = await this.serializeTree();

    this.header = {
      Signature: HEADER_SIGNATURE_CSGO,
      Version: HEADER_VERSION_CSGO,
      TreeSize: treeBuffer.length,
      FileDataSectionSize: 0,
      ArchiveMD5SectionSize: 0,
      OtherMD5SectionSize: 48,
      SignatureSectionSize: 0,
    };

    for (const ext in this.tree) {
      for (const dir in this.tree[ext]) {
        for (const file in this.tree[ext][dir]) {
          const entry = this.tree[ext][dir][file];

          if (entry.ArchiveIndex === ARCHIVE_INDEX_EMBEDDED) {
            this.header.FileDataSectionSize += entry.EntryLength;
          }
        }
      }
    }
  }

  /**
   * Build a VPK tree structure from a directory.
   *
   * @param directory The directory to build from.
   * @param offset    Tracks the current file offset.
   * @function
   */
  private async buildTree(directory = this.vpk, offset = 0) {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });

    this.log.debug('Building tree for directory: %s', directory);

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        offset = await this.buildTree(fullPath, offset);
      } else {
        // extract file properties
        const extension = path.extname(entry.name).slice(1);
        const relativePath = path.relative(this.vpk, fullPath);
        const baseName = path.basename(entry.name, `.${extension}`);
        const stats = await fs.promises.stat(fullPath);
        const buffer = await this.loadFile(fullPath);

        // vpk spec wants empty strings for empty dirs
        const relativeDir = path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath);

        if (!this.tree[extension]) {
          this.tree[extension] = {};
        }

        if (!this.tree[extension][relativeDir]) {
          this.tree[extension][relativeDir] = {};
        }

        this.tree[extension][relativeDir][baseName] = {
          CRC: zlib.crc32(buffer),
          PreloadBytes: 0,
          ArchiveIndex: ARCHIVE_INDEX_EMBEDDED,
          EntryOffset: offset,
          EntryLength: stats.size,
          Terminator: TERMINATOR,
        };

        this.log.debug(
          'Added file to tree: %s (extension: %s, directory: %s, offset: %s)',
          baseName,
          extension,
          relativeDir,
          offset,
        );

        offset += stats.size;
      }
    }

    return offset;
  }

  /**
   * Loads a file into the cache.
   *
   * @param filePath The path to the file.
   * @function
   */
  private async loadFile(filePath: string) {
    if (!this.files[filePath]) {
      const buffer = await fs.promises.readFile(filePath);
      this.files[filePath] = buffer;
    }

    return this.files[filePath];
  }

  /**
   * Reads the header contents of a VPK archive.
   *
   * @function
   */
  private async parseHeader(): Promise<HeaderV2> {
    return {
      Signature: this.buffer.readUInt32LE(0),
      Version: this.buffer.readUInt32LE(4),
      TreeSize: this.buffer.readUInt32LE(8),
      FileDataSectionSize: this.buffer.readUInt32LE(12),
      ArchiveMD5SectionSize: this.buffer.readUInt32LE(16),
      OtherMD5SectionSize: this.buffer.readUInt32LE(20),
      SignatureSectionSize: this.buffer.readUInt32LE(24),
    };
  }

  /**
   * Reads a null-terminated ASCII string.
   *
   * @param offset The offset to start from.
   * @function
   */
  private readString(offset: number) {
    let end = offset;

    // find the null byte (0x00) marking the end of the string
    while (this.buffer[end] !== 0 && end < this.buffer.length) {
      end++;
    }

    // return the string in ASCII encoding, excluding the null byte
    return this.buffer.toString('ascii', offset, end);
  }

  /**
   * Reads the directory tree.
   *
   * @function
   */
  private readTree() {
    let offset = HEADER_SIZE_BYTES;

    while (true) {
      const extension = this.readString(offset);

      if (!extension) {
        break;
      }

      // move past the null terminator
      offset += extension.length + 1;
      this.tree[extension] = {};

      // read the directories for this extension
      while (true) {
        const directory = this.readString(offset);

        if (directory === null) {
          this.log.error(`Malformed directory at offset ${offset}`);
          break;
        }

        // move past the null terminator
        offset += directory.length + 1;

        // end of directories for this extension
        if (directory === '') {
          break;
        }

        // initialize directory node
        this.tree[extension][directory] = {};

        // read the filenames for this directory
        while (true) {
          const filename = this.readString(offset);

          // end of filenames for this directory
          if (filename === null) {
            this.log.error(`Malformed filename at offset ${offset}`);
            break;
          }

          // move past the null terminator
          offset += filename.length + 1;

          // end of filenames for this directory
          if (filename === '') {
            break;
          }

          // read file metadata
          const CRC = this.buffer.readUInt32LE(offset);
          const PreloadBytes = this.buffer.readUInt16LE(offset + 4);
          const ArchiveIndex = this.buffer.readUInt16LE(offset + 6);
          const EntryOffset = this.buffer.readUInt32LE(offset + 8);
          const EntryLength = this.buffer.readUInt32LE(offset + 12);
          const Terminator = this.buffer.readUInt16LE(offset + 16);

          if (Terminator !== TERMINATOR) {
            this.log.error(
              `Invalid terminator 0x${Terminator.toString(16)} at offset ${offset + 16}`,
            );
            break;
          }

          // initialize directory entry node
          this.tree[extension][directory][filename] = {
            CRC,
            PreloadBytes,
            ArchiveIndex,
            EntryOffset,
            EntryLength,
            Terminator,
          };

          // increment offset by file metadata size
          offset += DIRECTORY_ENTRY_SIZE_BYTES;

          // add preload data size to offset only as needed
          if (PreloadBytes > 0) {
            offset += PreloadBytes;
          }
        }
      }
    }
  }

  /**
   * Serializes the current tree stored in
   * memory into VPK directory tree format.
   *
   * @function
   */
  private async serializeTree() {
    const parts: Buffer[] = [];

    for (const [extension, directories] of Object.entries(this.tree)) {
      // add extension with null terminator
      parts.push(Buffer.from(`${extension}\0`, 'ascii'));

      for (const [directory, files] of Object.entries(directories)) {
        // add directory with null terminator
        parts.push(Buffer.from(`${directory || ' '}\0`, 'ascii'));

        for (const [filename, metadata] of Object.entries(files)) {
          // add filename with null terminator
          parts.push(Buffer.from(`${filename}\0`, 'ascii'));

          // add file metadata
          const metadataBuffer = Buffer.alloc(DIRECTORY_ENTRY_SIZE_BYTES);
          metadataBuffer.writeUInt32LE(metadata.CRC, 0);
          metadataBuffer.writeUInt16LE(metadata.PreloadBytes, 4);
          metadataBuffer.writeUInt16LE(metadata.ArchiveIndex, 6);
          metadataBuffer.writeUInt32LE(metadata.EntryOffset, 8);
          metadataBuffer.writeUInt32LE(metadata.EntryLength, 12);
          metadataBuffer.writeUInt16LE(metadata.Terminator, 16);

          parts.push(metadataBuffer);
        }

        // end of filenames for this directory
        parts.push(Buffer.from('\0', 'ascii'));
      }

      // end of directories for this extension
      parts.push(Buffer.from('\0', 'ascii'));
    }

    // end of extensions
    parts.push(Buffer.from('\0', 'ascii'));

    // combine as a single buffer
    return Buffer.concat(parts);
  }

  /**
   * Create VPK from directory structure.
   *
   * The VPK will appear next to the directory.
   *
   * @function
   */
  public async create() {
    const outFile = this.vpk + '.vpk';
    this.log.info('Creating %s...', outFile);

    // prep the data
    await this.buildTree();
    await this.buildHeader();

    // prep the buffer to write to
    this.buffer = Buffer.alloc(
      HEADER_SIZE_BYTES +
        this.header.TreeSize +
        this.header.FileDataSectionSize +
        this.header.OtherMD5SectionSize +
        this.header.SignatureSectionSize,
    );

    // write the header to buffer
    let offset = 0;
    this.buffer.writeUInt32LE(this.header.Signature, offset);
    this.buffer.writeUInt32LE(this.header.Version, offset + 4);
    this.buffer.writeUInt32LE(this.header.TreeSize, offset + 8);
    this.buffer.writeUInt32LE(this.header.FileDataSectionSize, offset + 12);
    this.buffer.writeUInt32LE(this.header.ArchiveMD5SectionSize, offset + 16);
    this.buffer.writeUInt32LE(this.header.OtherMD5SectionSize, offset + 20);
    this.buffer.writeUInt32LE(this.header.SignatureSectionSize, offset + 24);
    offset += HEADER_SIZE_BYTES;

    // write the directory tree
    const treeBuffer = await this.serializeTree();
    treeBuffer.copy(this.buffer, offset);
    offset += this.header.TreeSize;

    // write embedded file data
    for (const ext in this.tree) {
      for (const dir in this.tree[ext]) {
        for (const file in this.tree[ext][dir]) {
          const entry = this.tree[ext][dir][file];

          if (entry.ArchiveIndex === ARCHIVE_INDEX_EMBEDDED) {
            const filePath = path.join(this.vpk, dir, `${file}.${ext}`);
            const fileBuffer = await this.loadFile(filePath);

            fileBuffer.copy(this.buffer, offset);
            offset += fileBuffer.length;
          }
        }
      }
    }

    // save to vpk file
    this.log.debug(JSON.stringify(this.header, null, 2));
    this.log.debug(JSON.stringify(this.tree, null, 2));
    return fs.promises.writeFile(outFile, this.buffer);
  }

  /**
   * Extracts the specified path from the VPK.
   *
   * @function
   */
  public async extract() {
    this.buffer = await fs.promises.readFile(this.vpk);
    this.header = await this.parseHeader();

    if (
      this.header.Signature !== HEADER_SIGNATURE_CS2 &&
      this.header.Signature !== HEADER_SIGNATURE_CSGO
    ) {
      throw new Error('invalid vpk signature');
    }

    if (this.header.Version !== HEADER_VERSION_CS2 && this.header.Version !== HEADER_VERSION_CSGO) {
      throw new Error('invalid vpk version');
    }

    this.readTree();
    this.log.debug(JSON.stringify(this.header, null, 2));
    this.log.debug(JSON.stringify(this.tree, null, 2));
    throw new Error('Not implemented');
  }
}
