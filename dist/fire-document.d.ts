import type { Converter, DocumentReference, DocumentSnapshot } from "./types";
export declare class FireDocument<TData> {
    readonly id: string;
    readonly ref: DocumentReference<TData>;
    parse: (data: unknown) => TData;
    constructor({ snap, parse, converter, }: {
        snap: DocumentSnapshot<TData>;
        parse: (data: unknown) => TData;
        converter: Converter<TData>;
    });
    toPlainData(): {
        [k: string]: unknown;
    };
    toParsedData(): TData;
    toData(): TData;
    update(): Promise<FirebaseFirestore.WriteResult>;
    delete(): Promise<FirebaseFirestore.WriteResult>;
    recursiveDelete(): Promise<void>;
}
