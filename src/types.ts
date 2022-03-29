import * as admin from "firebase-admin";

export type DocumentData = admin.firestore.DocumentData;

export type DocumentReference<T = DocumentData> = admin.firestore.DocumentReference<T>;
export type DocumentSnapshot<T = DocumentData> = admin.firestore.DocumentSnapshot<T>;

export type CollectionReference<T = DocumentData> = admin.firestore.CollectionReference<T>;
export type CollectionGroup<T = DocumentData> = admin.firestore.CollectionGroup<T>;
export type Query<T = DocumentData> = admin.firestore.Query<T>;

export type Converter<T = DocumentData> = admin.firestore.FirestoreDataConverter<T>;

export type PaginateInput<TCursor> = {
  first?: number | null;
  after?: TCursor | null;
  last?: number | null;
  before?: TCursor | null;
};
export type PageInfo<TCursor> = {
  startCursor?: TCursor;
  endCursor?: TCursor;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
