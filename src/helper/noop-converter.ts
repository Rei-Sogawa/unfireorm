import { Converter } from "../types";

export const createNoopConverter = <TData>(): Converter<TData> => ({
  toFirestore: (data) => {
    return data;
  },
  fromFirestore: (snap) => {
    return snap.data() as TData;
  },
});
