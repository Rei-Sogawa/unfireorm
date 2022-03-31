import type { FireDocument } from "./fire-document";
import { _paginateQuery } from "./helper";
import type {
  CollectionGroup,
  CollectionReference,
  Converter,
  DocumentReference,
  DocumentSnapshot,
  PaginateInput,
  Query,
  WriteResult,
} from "./types";

export class FireCollection<TData extends Record<string, unknown>, TFireDocument extends FireDocument<TData>> {
  readonly ref: CollectionReference<TData>;
  readonly transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;

  constructor(
    ref: CollectionReference,
    transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument,
    converter?: Converter<TData>
  ) {
    this.ref = converter ? ref.withConverter(converter) : (ref as CollectionReference<TData>);
    this.transformer = transformer;
  }

  findManyByQuery(queryFn: (ref: CollectionReference<TData>) => Query<TData>) {
    return queryFn(this.ref)
      .get()
      .then((qSnap) => qSnap.docs.map(this.transformer));
  }
  findOneById(id: string) {
    return this.ref.doc(id).get().then(this.transformer);
  }
  paginateQuery<TCursor>(
    paginateInput: PaginateInput<TCursor>,
    {
      forward,
      backward,
      cursorField,
    }: {
      forward: Query<TData>;
      backward: Query<TData>;
      cursorField: string;
    }
  ) {
    return _paginateQuery<TCursor, TData, TFireDocument>(
      paginateInput,
      { forward, backward, cursorField },
      this.findManyByQuery.bind(this)
    );
  }

  insert(data: TData): Promise<DocumentReference<TData>>;
  insert(data: TData & { id: string }): Promise<WriteResult>;
  async insert(data: TData & { id?: string }) {
    const { id, ...rest } = data;
    if (id) {
      return this.ref.doc(id).set(rest as TData);
    }
    return this.ref.add(rest as TData);
  }
}

export class FireCollectionGroup<
  TData extends Record<string, unknown> & { __id: string },
  TFireDocument extends FireDocument<TData>
> {
  readonly ref: CollectionGroup<TData>;
  readonly transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;

  constructor({
    ref,
    transformer,
    converter,
  }: {
    ref: CollectionGroup;
    transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;
    converter?: Converter<TData>;
  }) {
    this.ref = converter ? ref.withConverter(converter) : (ref as CollectionGroup<TData>);
    this.transformer = transformer;
  }

  findManyByQuery(queryFn: (ref: CollectionGroup<TData>) => Query<TData>) {
    return queryFn(this.ref)
      .get()
      .then((qSnap) => qSnap.docs.map(this.transformer));
  }
  findOneById(id: string) {
    return this.findManyByQuery((ref) => ref.where("__id", "==", id)).then((docs) => {
      const doc = docs.at(0);
      if (!doc) throw new Error("Doc not found.");
      return doc;
    });
  }
  paginateQuery<TCursor>(
    paginateInput: PaginateInput<TCursor>,
    {
      forward,
      backward,
      cursorField,
    }: {
      forward: Query<TData>;
      backward: Query<TData>;
      cursorField: string;
    }
  ) {
    return _paginateQuery<TCursor, TData, TFireDocument>(
      paginateInput,
      { forward, backward, cursorField },
      this.findManyByQuery.bind(this)
    );
  }
}
