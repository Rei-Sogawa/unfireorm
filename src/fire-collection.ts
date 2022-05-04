import type { FireDocument, FireDocumentInput } from "./fire-document";
import {
  CollectionDocumentLoader,
  CollectionGroupDocumentLoader,
  createCollectionDocumentLoader,
  createCollectionGroupDocumentLoader,
} from "./helper";
import type { CollectionGroup, CollectionReference, Converter, Query } from "./types";

export class FireCollection<TData extends Record<string, unknown>, TFireDocument extends FireDocument<TData>> {
  readonly ref: CollectionReference<TData>;
  readonly transformer: (dSnap: FireDocumentInput<TData>) => TFireDocument;
  readonly loader: CollectionDocumentLoader<TData>;

  constructor(
    ref: CollectionReference,
    transformer: (dSnap: FireDocumentInput<TData>) => TFireDocument,
    converter?: Converter<TData>
  ) {
    this.ref = converter ? ref.withConverter(converter) : (ref as CollectionReference<TData>);
    this.transformer = transformer;
    this.loader = createCollectionDocumentLoader(this.ref);
  }

  async findManyByQuery(queryFn: (ref: CollectionReference<TData>) => Query<TData>, { prime } = { prime: false }) {
    const snaps = await queryFn(this.ref).get();
    if (prime) {
      snaps.forEach((snap) => this.loader.prime(snap.id, snap));
    }
    return snaps.docs.map(this.transformer);
  }
  findOneById(id: string, { cache } = { cache: true }) {
    return cache ? this.loader.load(id).then(this.transformer) : this.loader.clear(id).load(id).then(this.transformer);
  }

  insert(_data: TData): Promise<TFireDocument>;
  insert(_data: TData & { id: string }): Promise<TFireDocument>;
  async insert(_data: TData & { id?: string }) {
    const { id, ...rest } = _data;
    const data = rest as TData;

    if (id) {
      await this.ref.doc(id).set(data);
      return this.transformer({
        id,
        ref: this.ref.doc(id),
        data: () => data,
      });
    }

    const ref = await this.ref.add(data);
    return this.transformer({
      id: ref.id,
      ref,
      data: () => data,
    });
  }
}

export class FireCollectionGroup<TData extends Record<string, unknown>, TFireDocument extends FireDocument<TData>> {
  readonly ref: CollectionGroup<TData>;
  readonly transformer: (dSnap: FireDocumentInput<TData>) => TFireDocument;
  readonly loader: CollectionGroupDocumentLoader<TData>;

  constructor(
    ref: CollectionGroup,
    transformer: (dSnap: FireDocumentInput<TData>) => TFireDocument,
    idFiled: keyof TData,
    converter?: Converter<TData>
  ) {
    this.ref = converter ? ref.withConverter(converter) : (ref as CollectionGroup<TData>);
    this.transformer = transformer;
    this.loader = createCollectionGroupDocumentLoader(this.ref, idFiled);
  }

  async findManyByQuery(queryFn: (ref: CollectionGroup<TData>) => Query<TData>, { prime } = { prime: false }) {
    const snaps = await queryFn(this.ref).get();
    if (prime) {
      snaps.forEach((snap) => this.loader.prime(snap.id, snap));
    }
    return snaps.docs.map(this.transformer);
  }
  findOneById(id: string, { cache } = { cache: true }) {
    return cache ? this.loader.load(id).then(this.transformer) : this.loader.clear(id).load(id).then(this.transformer);
  }
}
