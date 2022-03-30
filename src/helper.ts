import { FireDocument } from "./fire-document";
import { CollectionGroup, CollectionReference, PaginateInput, Query } from "./types";

type FindManyByQuery<TData extends Record<string, unknown>, TFirestoreDocument extends FireDocument<TData>> = (
  queryFn: (ref: CollectionReference<TData> | CollectionGroup<TData>) => Query<TData>
) => TFirestoreDocument[];

export const _paginate = async <
  TCursor,
  TData extends Record<string, unknown>,
  TFirestoreDocument extends FireDocument<TData>
>({
  paginateInput,
  forward,
  backward,
  cursorField,
  findManyByQuery,
}: {
  paginateInput: PaginateInput<TCursor>;
  forward: Query<TData>;
  backward: Query<TData>;
  cursorField: string;
  findManyByQuery: FindManyByQuery<TData, TFirestoreDocument>;
}) => {
  const { first, after, last, before } = paginateInput;

  const nodes = await (async () => {
    if (first) {
      return after
        ? findManyByQuery(() => forward.startAfter(after).limit(first))
        : findManyByQuery(() => forward.limit(first));
    }
    if (last) {
      const backwardNodes = (await before)
        ? findManyByQuery(() => backward.startAfter(before).limit(last))
        : findManyByQuery(() => forward.limit(last));
      return backwardNodes.reverse();
    }
    return findManyByQuery(() => forward);
  })();

  const edges = nodes.map((node) => {
    const data = node.toData();
    const cursor = data[cursorField] as TCursor | undefined;
    if (typeof cursor === "undefined") throw new Error(`data[${cursorField}] is undefined.`);
    return { node, cursor };
  });

  const endCursor = edges.at(-1)?.cursor;
  const startCursor = edges.at(0)?.cursor;

  const hasNextPage = endCursor
    ? (await findManyByQuery(() => forward.startAfter(endCursor).limit(1))).length > 0
    : false;
  const hasPreviousPage = startCursor
    ? (await findManyByQuery(() => forward.endBefore(startCursor).limit(1))).length > 0
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
};
