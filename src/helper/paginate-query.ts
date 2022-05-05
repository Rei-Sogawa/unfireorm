import { FireCollection, FireCollectionGroup } from "../fire-collection";
import { FireDocument } from "../fire-document";
import { Query } from "../types";

export type PaginateInput<TCursor> = {
  first?: number | null;
  after?: TCursor | null;
  last?: number | null;
  before?: TCursor | null;
};

export type QueryInput<TData> = {
  forward: Query<TData>;
  backward: Query<TData>;
  cursorField: keyof TData;
};

export const paginateQuery = async <
  TData extends Record<string, unknown>,
  TCursor extends TData[keyof TData],
  TFireDocument extends FireDocument<TData>,
  TCollection extends FireCollection<TData, TFireDocument> | FireCollectionGroup<TData, TFireDocument>
>(
  self: TCollection,
  paginateInput: PaginateInput<TCursor>,
  queryInput: QueryInput<TData>,
  { prime } = { prime: false }
) => {
  const { first, after, last, before } = paginateInput;
  const { forward, backward, cursorField } = queryInput;

  const nodes = await (async () => {
    if (first) {
      return after
        ? self.findManyByQuery(() => forward.startAfter(after).limit(first), { prime })
        : self.findManyByQuery(() => forward.limit(first), { prime });
    }
    if (last) {
      const backwardNodes = before
        ? await self.findManyByQuery(() => backward.startAfter(before).limit(last), { prime })
        : await self.findManyByQuery(() => backward.limit(last), { prime });
      return backwardNodes.reverse();
    }
    return self.findManyByQuery(() => forward, { prime });
  })();

  const edges = nodes.map((node) => {
    const data = node.toData();
    const cursor = data[cursorField] as TCursor | undefined;
    if (typeof cursor === "undefined") throw new Error(`data[${cursorField}] is undefined`);
    return { node, cursor };
  });

  const end = edges[edges.length - 1];
  const start = edges[0];
  const endCursor = end ? end.cursor : undefined;
  const startCursor = start ? start.cursor : undefined;

  const hasNextPage = endCursor
    ? (await self.findManyByQuery(() => forward.startAfter(endCursor).limit(1))).length > 0
    : false;
  const hasPreviousPage = startCursor
    ? (await self.findManyByQuery(() => forward.endBefore(startCursor).limit(1))).length > 0
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
