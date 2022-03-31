import { FireCollection } from "./fire-collection";
import { FireDocument } from "./fire-document";
import { Query } from "./types";

export type PaginateInput<TCursor> = {
  first?: number | null;
  after?: TCursor | null;
  last?: number | null;
  before?: TCursor | null;
};

export type QueryInput<TData> = {
  forward: Query<TData>;
  backward: Query<TData>;
  cursorField: string;
};

export type FindManyByQuery<
  TData extends Record<string, unknown>,
  TFireDocument extends FireDocument<TData>
> = FireCollection<TData, TFireDocument>["findManyByQuery"];

export const paginateQuery = async <
  TCursor,
  TData extends Record<string, unknown>,
  TFirestoreDocument extends FireDocument<TData>
>(
  paginateInput: PaginateInput<TCursor>,
  queryInput: QueryInput<TData>,
  findManyByQuery: FindManyByQuery<TData, TFirestoreDocument>
) => {
  const { first, after, last, before } = paginateInput;
  const { forward, backward, cursorField } = queryInput;

  const nodes = await (async () => {
    if (first) {
      return after
        ? findManyByQuery(() => forward.startAfter(after).limit(first))
        : findManyByQuery(() => forward.limit(first));
    }
    if (last) {
      const backwardNodes = before
        ? await findManyByQuery(() => backward.startAfter(before).limit(last))
        : await findManyByQuery(() => backward.limit(last));
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
