import { FireCollection } from "./fire-collection";
import type { Converter, DocumentReference, DocumentSnapshot } from "./types";

export type FireDocumentInput<TData> = Pick<DocumentSnapshot<TData>, "id" | "ref" | "data">;

export class FireDocument<TData extends Record<string, unknown>> {
  readonly id: string;
  readonly ref: DocumentReference<TData>;

  constructor(snap: FireDocumentInput<TData>, converter?: Converter<TData>) {
    this.id = snap.id;
    this.ref = converter ? snap.ref.withConverter(converter) : snap.ref;

    const data = snap.data();
    Object.assign(this, data);
  }

  toData() {
    const { id, ref, ...rest } = this;
    const data = Object.fromEntries(Object.entries(rest).filter(([, value]) => !(value instanceof FireCollection)));
    return data as TData;
  }
  async update() {
    await this.ref.set(this.toData());
    return this;
  }
  async delete() {
    await this.ref.delete();
    return this;
  }
}
