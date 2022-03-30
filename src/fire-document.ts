import { FireCollection } from "./fire-collection";
import type { Converter, DocumentReference, DocumentSnapshot } from "./types";

export class FireDocument<TData extends Record<string, unknown>> {
  readonly id: string;
  readonly ref: DocumentReference<TData>;

  constructor(snap: DocumentSnapshot<TData>, converter?: Converter<TData>) {
    this.id = snap.id;
    this.ref = converter ? snap.ref.withConverter(converter) : (snap.ref as DocumentReference<TData>);

    const data = snap.data();
    Object.assign(this, data);
  }

  toData() {
    const { id, ref, ...rest } = this;
    const data = Object.fromEntries(Object.entries(rest).filter(([_key, value]) => !(value instanceof FireCollection)));
    return data as TData;
  }

  update() {
    return this.ref.set(this.toData());
  }
  delete() {
    return this.ref.delete();
  }
  recursiveDelete() {
    return this.ref.firestore.recursiveDelete(this.ref);
  }
}
