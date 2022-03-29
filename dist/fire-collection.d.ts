import type { FireDocument } from "./fire-document";
import type { CollectionGroup, CollectionReference, Converter, DocumentSnapshot, PaginateInput, Query } from "./types";
export declare class FireCollection<TData, TFireDocument extends FireDocument<TData>> {
    readonly ref: CollectionReference<TData>;
    readonly parse: (data: unknown) => TData;
    readonly transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;
    constructor({ ref, parse, transformer, converter, }: {
        ref: CollectionReference;
        parse: (data: unknown) => TData;
        transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;
        converter: Converter<TData>;
    });
    findManyByQuery(queryFn: (ref: CollectionReference<TData>) => Query<TData>): Promise<TFireDocument[]>;
    findOneById(id: string): Promise<TFireDocument>;
    paginate<TCursor>({ paginateInput, forward, backward, cursorField, }: {
        paginateInput: PaginateInput<TCursor>;
        forward: Query<TData>;
        backward: Query<TData>;
        cursorField: string;
    }): Promise<{
        edges: {
            node: TFireDocument;
            cursor: TCursor;
        }[];
        pageInfo: {
            startCursor: TCursor | undefined;
            endCursor: TCursor | undefined;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    insert(data: TData): Promise<TFireDocument>;
    insert(data: TData & {
        id: string;
    }): Promise<TFireDocument>;
}
export declare class FireCollectionGroup<TData extends {
    __id: string;
}, TFireDocument extends FireDocument<TData>> {
    readonly ref: CollectionGroup<TData>;
    readonly parse: (data: unknown) => TData;
    readonly transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;
    constructor({ ref, parse, transformer, converter, }: {
        ref: CollectionGroup;
        parse: (data: unknown) => TData;
        transformer: (dSnap: DocumentSnapshot<TData>) => TFireDocument;
        converter: Converter<TData>;
    });
    findManyByQuery(queryFn: (ref: CollectionGroup<TData>) => Query<TData>): Promise<TFireDocument[]>;
    findOneById(id: string): Promise<TFireDocument>;
    paginate<TCursor>({ paginateInput, forward, backward, cursorField, }: {
        paginateInput: PaginateInput<TCursor>;
        forward: Query<TData>;
        backward: Query<TData>;
        cursorField: string;
    }): Promise<{
        edges: {
            node: TFireDocument;
            cursor: TCursor;
        }[];
        pageInfo: {
            startCursor: TCursor | undefined;
            endCursor: TCursor | undefined;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
}
