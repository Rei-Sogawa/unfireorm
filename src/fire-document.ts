import type { Converter, DocumentReference, DocumentSnapshot, PartialWithFieldValue } from "./types";

export type FireDocumentInput = Pick<DocumentSnapshot, "id" | "ref" | "data">;

export abstract class FireDocument<TData extends Record<string, unknown>> {
  readonly id: string;
  readonly ref: DocumentReference<TData>;

  constructor(snap: FireDocumentInput, converter?: Converter<TData>) {
    this.id = snap.id;
    this.ref = converter ? snap.ref.withConverter(converter) : (snap.ref as DocumentReference<TData>);

    const data = snap.data();
    Object.assign(this, data);
  }

  abstract toData(): TData;

  edit(data: PartialWithFieldValue<TData>) {
    Object.assign(this, data);
    return this;
  }
  async set() {
    await this.ref.set(this.toData());
    return this;
  }
  async delete() {
    await this.ref.delete();
    return this;
  }
}
