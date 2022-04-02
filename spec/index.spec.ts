import { Timestamp } from "firebase-admin/firestore";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { CollectionGroup, CollectionReference } from "../src/types";
import { FireCollection, FireCollectionGroup } from "./../src/fire-collection";
import { FireDocument } from "./../src/fire-document";
import { PaginateInput, paginateQuery } from "./../src/helper";
import { clearFirestore, getDb, id } from "./test-util";

const db = getDb();
const usersRef = db.collection("users");
const postsGroupRef = db.collectionGroup("posts");

type UserData = {
  displayName: string;
  createdAt: Timestamp;
};
class UserDoc extends FireDocument<UserData> implements UserData {
  displayName: string;
  createdAt: Timestamp;
  postsCollection = new PostsCollection(this.ref.collection("posts"));

  static create(data: Partial<UserData>): UserData {
    return {
      displayName: "MyString",
      createdAt: Timestamp.fromDate(new Date("1999-12-31")),
      ...data,
    };
  }
}
class UsersCollection extends FireCollection<UserData, UserDoc> {
  constructor(ref: CollectionReference) {
    super(ref, (snap) => new UserDoc(snap));
  }
  findAll(paginateInput: PaginateInput<Timestamp>) {
    return paginateQuery(
      paginateInput,
      {
        forward: this.ref.orderBy("createdAt", "asc"),
        backward: this.ref.orderBy("createdAt", "desc"),
        cursorField: "createdAt",
      },
      this.findManyByQuery.bind(this)
    );
  }
}

type PostData = {
  __id: string;
  content: string;
  createdAt: Timestamp;
};
class PostDoc extends FireDocument<PostData> implements PostData {
  __id: string;
  content: string;
  createdAt: Timestamp;

  static create(data: Partial<PostData>): PostData {
    return {
      __id: id(),
      content: "MyString",
      createdAt: Timestamp.fromDate(new Date("1999-12-31")),
      ...data,
    };
  }
}
class PostsCollection extends FireCollection<PostData, PostDoc> {
  constructor(ref: CollectionReference) {
    super(ref, (snap) => new PostDoc(snap));
  }
  findAll(paginateInput: PaginateInput<Timestamp>) {
    return paginateQuery(
      paginateInput,
      {
        forward: this.ref.orderBy("createdAt", "asc"),
        backward: this.ref.orderBy("createdAt", "desc"),
        cursorField: "createdAt",
      },
      this.findManyByQuery.bind(this)
    );
  }
}
class PostsCollectionGroup extends FireCollectionGroup<PostData, PostDoc> {
  constructor(ref: CollectionGroup) {
    super(ref, (snap) => new PostDoc(snap));
  }
  findAll(paginateInput: PaginateInput<Timestamp>) {
    return paginateQuery(
      paginateInput,
      {
        forward: this.ref.orderBy("createdAt", "asc"),
        backward: this.ref.orderBy("createdAt", "desc"),
        cursorField: "createdAt",
      },
      this.findManyByQuery.bind(this)
    );
  }
}

const usersCollection = new UsersCollection(usersRef);
const postsCollectionGroup = new PostsCollectionGroup(postsGroupRef);

beforeEach(async () => {
  await clearFirestore();
});
afterAll(async () => {
  await clearFirestore();
});

describe("Collection", () => {
  it("insert", async () => {
    const data = UserDoc.create({ displayName: "user-1" });
    const { id } = await usersCollection.insert(data);

    const gotData = await usersRef
      .doc(id)
      .get()
      .then((snap) => snap.data());

    expect(gotData).toStrictEqual(data);
  });

  it("insert (with id)", async () => {
    const data = UserDoc.create({ displayName: "user-1" });
    await usersCollection.insert({ id: "1", ...data });

    const gotData = await usersRef
      .doc("1")
      .get()
      .then((snap) => snap.data());

    expect(gotData).toStrictEqual(data);
  });

  it("findOneById", async () => {
    const data = UserDoc.create({ displayName: "user-1" });
    const { id } = await usersRef.add(data);

    const user = await usersCollection.findOneById(id);

    expect(user.toData()).toStrictEqual(data);
  });

  it("findManyByQuery", async () => {
    const data1 = UserDoc.create({ displayName: "user-1" });
    const data2 = UserDoc.create({ displayName: "user-2" });

    await usersRef.add(data1);
    await usersRef.add(data2);

    const [user1] = await usersCollection.findManyByQuery((ref) => ref.where("displayName", "==", "user-1"));

    expect(user1.toData()).toStrictEqual(data1);
  });

  it("paginate", async () => {
    const dataList = Array.from({ length: 10 }).map((_, idx) => {
      let date = new Date("1999-12-31");
      date = new Date(date.setDate(date.getDate() + idx));

      const data = UserDoc.create({
        displayName: `user-${idx}`,
        createdAt: Timestamp.fromDate(date),
      });
      return data;
    });

    await Promise.all(dataList.map((data) => usersRef.add(data)));

    const all = await usersCollection.findAll({});
    expect(all.edges.map((edge) => edge.node.toData())).toStrictEqual(dataList);

    const PAGE_SIZE = 2;

    const firstPage = await usersCollection.findAll({ first: PAGE_SIZE });
    const firstPageData = firstPage.edges.map((edge) => edge.node.toData());
    expect(firstPageData).toStrictEqual(dataList.slice(0, 2));

    const secondPage = await usersCollection.findAll({ first: PAGE_SIZE, after: firstPage.pageInfo.endCursor });
    const secondPageData = secondPage.edges.map((edge) => edge.node.toData());
    expect(secondPageData).toStrictEqual(dataList.slice(2, 4));

    const thirdPage = await usersCollection.findAll({ first: PAGE_SIZE, after: secondPage.pageInfo.endCursor });
    const thirdPageData = thirdPage.edges.map((edge) => edge.node.toData());
    expect(thirdPageData).toStrictEqual(dataList.slice(4, 6));

    const backToSecondPage = await usersCollection.findAll({
      last: PAGE_SIZE,
      before: thirdPage.pageInfo.startCursor,
    });
    const backToSecondPageData = backToSecondPage.edges.map((edge) => edge.node.toData());
    expect(backToSecondPageData).toStrictEqual(dataList.slice(2, 4));

    const goToLastPage = await usersCollection.findAll({ last: PAGE_SIZE });
    const goToLastPageData = goToLastPage.edges.map((edge) => edge.node.toData());
    expect(goToLastPageData).toStrictEqual(dataList.slice(8, 10));
  });

  it("loader", async () => {
    const data1 = UserDoc.create({ displayName: "user-1" });
    const data2 = UserDoc.create({ displayName: "user-2" });

    await usersRef.add(data1);
    await usersRef.add(data2);

    const [user1, user2] = await usersCollection.findManyByQuery((ref) => ref.orderBy("displayName", "asc"), {
      prime: true,
    });
    user1.displayName = "user-101";
    user2.displayName = "user-102";
    await user1.update();
    await user2.update();

    const cachedUser1 = await usersCollection.findOneById(user1.id, { cache: true });
    const cachedUser2 = await usersCollection.findOneById(user2.id, { cache: true });

    expect(cachedUser1.toData()).toStrictEqual(data1);
    expect(cachedUser2.toData()).toStrictEqual(data2);
  });
});

describe("CollectionGroup", () => {
  it("findOneById", async () => {
    const userData = UserDoc.create({});
    const { id } = await usersCollection.insert(userData);
    const user = await usersCollection.findOneById(id);

    const postData = PostDoc.create({ __id: "1" });
    await user.postsCollection.insert({ id: "1", ...postData });

    const post = await postsCollectionGroup.findOneById("1");

    expect(post.toData()).toStrictEqual(postData);
  });

  it("findManyByQuery", async () => {
    const users = await Promise.all(
      Array.from({ length: 2 }).map(() =>
        usersCollection.insert(UserDoc.create({})).then(({ id }) => usersCollection.findOneById(id))
      )
    );

    const postData1 = PostDoc.create({ __id: "1", content: "post-1" });
    await users.at(0).postsCollection.insert({ id: "1", ...postData1 });
    const postData2 = PostDoc.create({ __id: "2", content: "post-2" });
    await users.at(1).postsCollection.insert({ id: "2", ...postData2 });

    const [post1] = await postsCollectionGroup.findManyByQuery((ref) => ref.where("content", "==", "post-1"));

    expect(post1.toData()).toStrictEqual(postData1);
  });

  it("paginate", async () => {
    const dataList = Array.from({ length: 10 }).map((_, idx) => {
      let date = new Date("1999-12-31");
      date = new Date(date.setDate(date.getDate() + idx));

      const data = PostDoc.create({
        content: `post-${idx}`,
        createdAt: Timestamp.fromDate(date),
      });
      return data;
    });

    const users = await Promise.all(
      Array.from({ length: 4 }).map(() =>
        usersCollection.insert(UserDoc.create({})).then(({ id }) => usersCollection.findOneById(id))
      )
    );

    await Promise.all(
      dataList.map((data, idx) => users.at(idx % 4).postsCollection.insert({ id: data.__id, ...data }))
    );

    const all = await postsCollectionGroup.findAll({});
    expect(all.edges.map((edge) => edge.node.toData())).toStrictEqual(dataList);

    const PAGE_SIZE = 2;

    const firstPage = await postsCollectionGroup.findAll({ first: PAGE_SIZE });
    const firstPageData = firstPage.edges.map((edge) => edge.node.toData());
    expect(firstPageData).toStrictEqual(dataList.slice(0, 2));

    const secondPage = await postsCollectionGroup.findAll({ first: PAGE_SIZE, after: firstPage.pageInfo.endCursor });
    const secondPageData = secondPage.edges.map((edge) => edge.node.toData());
    expect(secondPageData).toStrictEqual(dataList.slice(2, 4));

    const thirdPage = await postsCollectionGroup.findAll({ first: PAGE_SIZE, after: secondPage.pageInfo.endCursor });
    const thirdPageData = thirdPage.edges.map((edge) => edge.node.toData());
    expect(thirdPageData).toStrictEqual(dataList.slice(4, 6));

    const backToSecondPage = await postsCollectionGroup.findAll({
      last: PAGE_SIZE,
      before: thirdPage.pageInfo.startCursor,
    });
    const backToSecondPageData = backToSecondPage.edges.map((edge) => edge.node.toData());
    expect(backToSecondPageData).toStrictEqual(dataList.slice(2, 4));

    const goToLastPage = await postsCollectionGroup.findAll({ last: PAGE_SIZE });
    const goToLastPageData = goToLastPage.edges.map((edge) => edge.node.toData());
    expect(goToLastPageData).toStrictEqual(dataList.slice(8, 10));
  });

  it("loader", async () => {
    const data1 = PostDoc.create({ content: "post-1" });
    const data2 = PostDoc.create({ content: "post-2" });

    await usersCollection.insert(UserDoc.create({})).then((user) => user.postsCollection.insert(data1));
    await usersCollection.insert(UserDoc.create({})).then((user) => user.postsCollection.insert(data2));

    const [post1, post2] = await postsCollectionGroup.findManyByQuery((ref) => ref.orderBy("content", "asc"), {
      prime: true,
    });
    post1.content = "post-101";
    post2.content = "post-102";
    await post1.update();
    await post2.update();

    const cachedPost1 = await postsCollectionGroup.findOneById(post1.id, { cache: true });
    const cachedPost2 = await postsCollectionGroup.findOneById(post2.id, { cache: true });

    expect(cachedPost1.toData()).toStrictEqual(data1);
    expect(cachedPost2.toData()).toStrictEqual(data2);
  });
});

describe("Document", () => {
  it("update", async () => {
    const data = UserDoc.create({ displayName: "user-1" });
    const user = await usersCollection.insert(data);

    user.displayName = "user-99";
    await user.update();

    const userAfterUpdate = await usersCollection.findOneById(user.id);

    expect(userAfterUpdate.toData()).toStrictEqual({ displayName: "user-99", createdAt: user.createdAt });
  });

  it("delete", async () => {
    const data = UserDoc.create({});
    const user = await usersCollection.insert(data);

    const exists = await usersRef
      .doc(user.id)
      .get()
      .then((snap) => snap.exists);

    expect(exists).toBe(false);
  });
});
