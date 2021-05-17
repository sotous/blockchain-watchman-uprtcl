import CID from 'cids';
import multihashing from 'multihashing-async';

export class CidConfig {
  base: string;
  version: number;
  codec: string;
  type: string;
  digest: Uint8Array;

  constructor(
    _base: string,
    _version: number,
    _codec: string,
    _type: string,
    _digest: Uint8Array
  ) {
    this.base = _base;
    this.version = _version;
    this.codec = _codec;
    this.type = _type;
    this.digest = _digest;
  }

  static fromCid(cidStr: string) {
    let cid = new CID(cidStr);
    let multihash = multihashing.multihash.decode(cid.multihash);

    console.log(multihash);

    return new CidConfig(
      cid.multibaseName,
      cid.version,
      cid.codec,
      multihash.name,
      multihash.digest
    );
  }
}
