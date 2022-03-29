import type { FireDocument } from "./fire-document";
import type { CollectionGroup, CollectionReference, Converter, DocumentSnapshot, PaginateInput, Query } from "./types";

export class FireCollection<TData, TFireDocument extends FireDocument<TData>> {
  readonly ref: CollectionReference<TData>;
  readonly parse: (data: unknown) => TData;
  readonly transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;

  constructor({
    ref,
    parse,
    transformer,
    converter,
  }: {
    ref: CollectionReference;
    parse: (data: unknown) => TData;
    transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;
    converter: Converter<TData>;
  }) {
    this.ref = ref.withConverter(converter);
    this.parse = parse;
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

  async paginate<TCursor>({
    paginateInput,
    forward,
    backward,
    cursorField,
  }: {
    paginateInput: PaginateInput<TCursor>;
    forward: Query<TData>;
    backward: Query<TData>;
    cursorField: string;
  }) {
    const { first, after, last, before } = paginateInput;

    const nodes = await (async () => {
      if (first) {
        return after
          ? this.findManyByQuery(() => forward.startAfter(after).limit(first))
          : this.findManyByQuery(() => forward.limit(first));
      }
      if (last) {
        const _nodes = before
          ? await this.findManyByQuery(() => backward.startAfter(before).limit(last))
          : await this.findManyByQuery(() => backward.limit(last));
        return _nodes.reverse();
      }
      return this.findManyByQuery(() => forward);
    })();

    const edges = nodes.map((node) => {
      const data = node.toPlainData();
      const cursor = data[cursorField] as TCursor;
      if (typeof cursor === "undefined") throw new Error(`data[${cursorField}] is undefined.`);
      return { node, cursor };
    });

    const endCursor = edges.at(-1)?.cursor;
    const startCursor = edges.at(0)?.cursor;

    const hasNextPage = endCursor
      ? (await this.findManyByQuery(() => forward.startAfter(endCursor).limit(1))).length > 0
      : false;
    const hasPreviousPage = startCursor
      ? (await this.findManyByQuery(() => forward.endBefore(startCursor).limit(1))).length > 0
      : false;

    return {
      edges,
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  insert(data: TData): Promise<TFireDocument>;
  insert(data: TData & { id: string }): Promise<TFireDocument>;
  async insert(data: TData & { id?: string }) {
    const { id, ...withoutId } = data;
    const parsedData = this.parse(withoutId);
    if (id) {
      await this.ref.doc(id).set(parsedData);
      return this.findOneById(id);
    }
    const dRef = await this.ref.add(parsedData);
    return this.findOneById(dRef.id);
  }
}

export class FireCollectionGroup<TData extends { __id: string }, TFireDocument extends FireDocument<TData>> {
  readonly ref: CollectionGroup<TData>;
  readonly parse: (data: unknown) => TData;
  readonly transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;

  constructor({
    ref,
    parse,
    transformer,
    converter,
  }: {
    ref: CollectionGroup;
    parse: (data: unknown) => TData;
    transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;
    converter: Converter<TData>;
  }) {
    this.ref = ref.withConverter(converter);
    this.parse = parse;
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

  async paginate<TCursor>({
    paginateInput,
    forward,
    backward,
    cursorField,
  }: {
    paginateInput: PaginateInput<TCursor>;
    forward: Query<TData>;
    backward: Query<TData>;
    cursorField: string;
  }) {
    const { first, after, last, before } = paginateInput;

    const nodes = await (async () => {
      if (first) {
        return after
          ? this.findManyByQuery(() => forward.startAfter(after).limit(first))
          : this.findManyByQuery(() => forward.limit(first));
      }
      if (last) {
        const _nodes = before
          ? await this.findManyByQuery(() => backward.startAfter(before).limit(last))
          : await this.findManyByQuery(() => backward.limit(last));
        return _nodes.reverse();
      }
      return this.findManyByQuery(() => forward);
    })();

    const edges = nodes.map((node) => {
      const data = node.toPlainData();
      const cursor = data[cursorField] as TCursor;
      if (typeof cursor === "undefined") throw new Error(`data[${cursorField}] is undefined.`);
      return { node, cursor };
    });

    const endCursor = edges.at(-1)?.cursor;
    const startCursor = edges.at(0)?.cursor;

    const hasNextPage = endCursor
      ? (await this.findManyByQuery(() => forward.startAfter(endCursor).limit(1))).length > 0
      : false;
    const hasPreviousPage = startCursor
      ? (await this.findManyByQuery(() => forward.endBefore(startCursor).limit(1))).length > 0
      : false;

    return {
      edges,
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }
}
