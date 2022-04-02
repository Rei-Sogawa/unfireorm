import DataLoader from "dataloader";

import { CollectionGroup, CollectionReference, DocumentSnapshot } from "../types";

export type CollectionDocumentLoader<TData> = DataLoader<string, DocumentSnapshot<TData>>;

export const createCollectionDocumentLoader = <TData extends Record<string, unknown>>(
  ref: CollectionReference<TData>
) => {
  const loader = new DataLoader<string, DocumentSnapshot<TData>>((ids) => {
    return Promise.all(ids.map((id) => ref.doc(id).get()));
  });
  return loader;
};

export type CollectionGroupDocumentLoader<TData> = DataLoader<string, DocumentSnapshot<TData>>;

export const createCollectionGroupDocumentLoader = <TData extends Record<string, unknown> & { __id: string }>(
  ref: CollectionGroup<TData>
) => {
  const loader = new DataLoader<string, DocumentSnapshot<TData>>((ids) => {
    return Promise.all(
      ids.map(async (id) => {
        const snaps = await ref
          .where("__id", "==", id)
          .get()
          .then(({ docs }) => docs);
        const snap = snaps.at(0);
        if (!snap) throw new Error("Snap not found");
        return snap;
      })
    );
  });
  return loader;
};
