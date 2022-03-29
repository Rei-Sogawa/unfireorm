import type { Converter, DocumentReference, DocumentSnapshot } from "./types";

export class FireDocument<TData> {
  readonly id: string;
  readonly ref: DocumentReference<TData>;
  parse: (data: unknown) => TData;

  constructor({
    snap,
    parse,
    converter,
  }: {
    snap: DocumentSnapshot<TData>;
    parse: (data: unknown) => TData;
    converter: Converter<TData>;
  }) {
    this.id = snap.id;
    this.ref = snap.ref.withConverter(converter);
    this.parse = parse;

    const data = snap.data();
    Object.assign(this, data);
  }

  toPlainData() {
    const { id, ref, parse, ...rest } = this;
    const data = Object.fromEntries(Object.entries(rest).filter(([key]) => !key.toLowerCase().endsWith("collection")));
    return data;
  }
  toParsedData() {
    return this.parse(this.toPlainData());
  }
  toData() {
    return this.toParsedData();
  }

  update() {
    return this.ref.set(this.toParsedData());
  }
  delete() {
    return this.ref.delete();
  }
  recursiveDelete() {
    return this.ref.firestore.recursiveDelete(this.ref);
  }
}
