"use strict";
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
exports.FireDocument = void 0;
class FireDocument {
    constructor({ snap, parse, converter, }) {
        this.id = snap.id;
        this.ref = snap.ref.withConverter(converter);
        this.parse = parse;
        const data = snap.data();
        Object.assign(this, data);
    }
    toPlainData() {
        const _a = this, { id, ref, parse } = _a, rest = __rest(_a, ["id", "ref", "parse"]);
        const data = Object.fromEntries(Object.entries(rest).filter(([key]) => !key.toLowerCase().endsWith("collection")));
        return data;
    }
    toParsedData() {
        return this.parse(this.toPlainData());
    }
    toData() {
        return this.toParsedData();
    }
    update() {
        return this.ref.set(this.toParsedData());
    }
    delete() {
        return this.ref.delete();
    }
    recursiveDelete() {
        return this.ref.firestore.recursiveDelete(this.ref);
    }
}
exports.FireDocument = FireDocument;
