"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireCollectionGroup = exports.FireCollection = void 0;
class FireCollection {
    constructor({ ref, parse, transformer, converter, }) {
        this.ref = ref.withConverter(converter);
        this.parse = parse;
        this.transformer = transformer;
    }
    findManyByQuery(queryFn) {
        return queryFn(this.ref)
            .get()
            .then((qSnap) => qSnap.docs.map(this.transformer));
    }
    findOneById(id) {
        return this.ref.doc(id).get().then(this.transformer);
    }
    paginate({ paginateInput, forward, backward, cursorField, }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { first, after, last, before } = paginateInput;
            const nodes = yield (() => __awaiter(this, void 0, void 0, function* () {
                if (first) {
                    return after
                        ? this.findManyByQuery(() => forward.startAfter(after).limit(first))
                        : this.findManyByQuery(() => forward.limit(first));
                }
                if (last) {
                    return last
                        ? this.findManyByQuery(() => backward.startAfter(before).limit(last))
                        : this.findManyByQuery(() => backward.limit(last));
                }
                return this.findManyByQuery(() => forward);
            }))();
            const edges = nodes.map((node) => {
                const data = node.toPlainData();
                const cursor = data[cursorField];
                return { node, cursor };
            });
            const endCursor = (_a = edges.at(-1)) === null || _a === void 0 ? void 0 : _a.cursor;
            const startCursor = (_b = edges.at(0)) === null || _b === void 0 ? void 0 : _b.cursor;
            const hasNextPage = endCursor
                ? (yield this.findManyByQuery(() => forward.startAfter(endCursor).limit(1))).length > 0
                : false;
            const hasPreviousPage = startCursor
                ? (yield this.findManyByQuery(() => forward.endBefore(startCursor).limit(1))).length > 0
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
        });
    }
    insert(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = data, withoutId = __rest(data, ["id"]);
            const parsedData = this.parse(withoutId);
            if (id) {
                yield this.ref.doc(id).set(parsedData);
                return this.findOneById(id);
            }
            const dRef = yield this.ref.add(parsedData);
            return this.findOneById(dRef.id);
        });
    }
}
exports.FireCollection = FireCollection;
class FireCollectionGroup {
    constructor({ ref, parse, transformer, converter, }) {
        this.ref = ref.withConverter(converter);
        this.parse = parse;
        this.transformer = transformer;
    }
    findManyByQuery(queryFn) {
        return queryFn(this.ref)
            .get()
            .then((qSnap) => qSnap.docs.map(this.transformer));
    }
    findOneById(id) {
        return this.findManyByQuery((ref) => ref.where("__id", "==", id)).then((docs) => {
            const doc = docs.at(0);
            if (!doc)
                throw new Error("Doc not found.");
            return doc;
        });
    }
    paginate({ paginateInput, forward, backward, cursorField, }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { first, after, last, before } = paginateInput;
            const nodes = yield (() => __awaiter(this, void 0, void 0, function* () {
                if (first) {
                    return after
                        ? this.findManyByQuery(() => forward.startAfter(after).limit(first))
                        : this.findManyByQuery(() => forward.limit(first));
                }
                if (last) {
                    return last
                        ? this.findManyByQuery(() => backward.startAfter(before).limit(last))
                        : this.findManyByQuery(() => backward.limit(last));
                }
                return this.findManyByQuery(() => forward);
            }))();
            const edges = nodes.map((node) => {
                const data = node.toPlainData();
                const cursor = data[cursorField];
                return { node, cursor };
            });
            const endCursor = (_a = edges.at(-1)) === null || _a === void 0 ? void 0 : _a.cursor;
            const startCursor = (_b = edges.at(0)) === null || _b === void 0 ? void 0 : _b.cursor;
            const hasNextPage = endCursor
                ? (yield this.findManyByQuery(() => forward.startAfter(endCursor).limit(1))).length > 0
                : false;
            const hasPreviousPage = startCursor
                ? (yield this.findManyByQuery(() => forward.endBefore(startCursor).limit(1))).length > 0
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
        });
    }
}
exports.FireCollectionGroup = FireCollectionGroup;
