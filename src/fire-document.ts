import type { Converter, DocumentReference, DocumentSnapshot } from "./types";

export type FireDocumentInput<TData> = Pick<DocumentSnapshot<TData>, "id" | "ref" | "data">;

export abstract class FireDocument<TData extends Record<string, unknown>> {
  readonly id: string;
  readonly ref: DocumentReference<TData>;

  constructor(snap: FireDocumentInput<TData>, converter: Converter<TData>) {
    this.id = snap.id;
    this.ref = snap.ref.withConverter(converter);

    const data = snap.data();
    Object.assign(this, data);
  }

  abstract toData(): TData;
  async update() {
    await this.ref.set(this.toData());
    return this;
  }
  async delete() {
    await this.ref.delete();
    return this;
  }
}
