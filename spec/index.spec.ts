import { Timestamp } from "firebase-admin/firestore";
import { afterAll, assert, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { CollectionReference } from "../src/types";
import { FireCollection } from "./../src/fire-collection";
import { FireDocument } from "./../src/fire-document";
import { clearFirestore, getDb } from "./test-util";

const db = getDb();
const usersRef = db.collection("users");

type UserData = {
  displayName: string;
  createdAt: Timestamp;
};
class UserDoc extends FireDocument<UserData> {}
class UsersCollection extends FireCollection<UserData, UserDoc> {
  constructor(ref: CollectionReference) {
    super(ref, (snap) => new UserDoc(snap));
  }
  findAll(paginateInput) {
    return this.paginate({
      paginateInput,
      forward: this.ref.orderBy("createdAt", "desc"),
      backward: this.ref.orderBy("createdAt", "asc"),
      cursorField: "createdAt",
    });
  }
}

const createUserData = ({
  displayName = "MyString",
  createdAt = Timestamp.fromDate(new Date("1999-12-31")),
}: {
  displayName?: string;
  createdAt?: Timestamp;
}): UserData => {
  return { displayName, createdAt };
};

describe("fire-collection", () => {
  beforeEach(async () => {
    await clearFirestore();
  });
  afterAll(async () => {
    await clearFirestore();
  });

  const usersCollection = new UsersCollection(usersRef);

  it("insert", async () => {
    const data = createUserData({ displayName: "user-1" });
    const { id } = await usersCollection.insert(data);

    const gotData = await usersRef
      .doc(id)
      .get()
      .then((snap) => snap.data());

    expect(data).toStrictEqual(gotData);
  });

  it("insert (with id)", async () => {
    const data = createUserData({ displayName: "user-1" });
    await usersCollection.insert({ id: "1", ...data });

    const gotData = await usersRef
      .doc("1")
      .get()
      .then((snap) => snap.data());

    expect(data).toStrictEqual(gotData);
  });

  it("findOneById", async () => {
    const data = createUserData({ displayName: "user-1" });
    const { id } = await usersRef.add(data);

    const user = await usersCollection.findOneById(id);

    expect(data).toStrictEqual(user.toData());
  });

  it("findManyByQuery", async () => {
    const data1 = createUserData({ displayName: "user-1" });
    const data2 = createUserData({ displayName: "user-2" });

    await usersRef.add(data1);
    await usersRef.add(data2);

    const [user1] = await usersCollection.findManyByQuery((ref) => ref.where("displayName", "==", "user-1"));

    expect(data1).toStrictEqual(user1.toData());
  });

  it("paginate", async () => {
    const dataList = Array.from({ length: 10 }).map((_, idx) => {
      let date = new Date("1999-12-31");
      date = new Date(date.setDate(date.getDate() + idx));

      const data = createUserData({
        displayName: `user-${idx}`,
        createdAt: Timestamp.fromDate(date),
      });
      return data;
    });

    await Promise.all(dataList.map((data) => usersRef.add(data)));

    const all = await usersCollection.findAll({});

    expect(dataList).toStrictEqual(all);
  });
});
