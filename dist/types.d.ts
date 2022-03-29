import * as admin from "firebase-admin";
export declare type DocumentData = admin.firestore.DocumentData;
export declare type DocumentReference<T = DocumentData> = admin.firestore.DocumentReference<T>;
export declare type DocumentSnapshot<T = DocumentData> = admin.firestore.DocumentSnapshot<T>;
export declare type CollectionReference<T = DocumentData> = admin.firestore.CollectionReference<T>;
export declare type CollectionGroup<T = DocumentData> = admin.firestore.CollectionGroup<T>;
export declare type Query<T = DocumentData> = admin.firestore.Query<T>;
export declare type Converter<T = DocumentData> = admin.firestore.FirestoreDataConverter<T>;
export declare type PaginateInput<TCursor> = {
    first?: number | null;
    after?: TCursor | null;
    last?: number | null;
    before?: TCursor | null;
};
export declare type PageInfo<TCursor> = {
    startCursor?: TCursor;
    endCursor?: TCursor;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};
