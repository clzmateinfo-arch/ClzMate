const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const h = require("./helpers");
const Classroom = require("../src/models/classroom");
const Topic = require("../src/models/topic");
const Assignment = require("../src/models/assignment");
const Submission = require("../src/models/submission");
const Quiz = require("../src/models/quiz");
const Attempt = require("../src/models/attempt");

const BASE = "/api/v1/classroom";
const UNKNOWN_ID = String(new mongoose.Types.ObjectId());
const MALFORMED_ID = "not-an-id";

async function seed() {
    const owner = await h.createUser({ accountType: "Instructor", approved: true });
    const otherInstructor = await h.createUser({ accountType: "Instructor", approved: true });
    const studentA = await h.createUser({ accountType: "Student" });
    const studentB = await h.createUser({ accountType: "Student" });
    const outsider = await h.createUser({ accountType: "Student" });
    const admin = await h.createUser({ accountType: "Admin" });

    const createRes = await h.asUser(owner).post(`${BASE}/create`).send({ title: "Physics" });
    assert.equal(createRes.status, 200);
    const classroomId = createRes.body.data._id;
    const { inviteCode } = createRes.body.data;

    const otherRes = await h.asUser(otherInstructor).post(`${BASE}/create`).send({ title: "Chemistry" });
    const otherClassroomId = otherRes.body.data._id;

    for (const student of [studentA, studentB]) {
        const joinRes = await h.asUser(student).post(`${BASE}/join`).send({ inviteCode });
        assert.equal(joinRes.status, 200);
    }

    const topicRes = await h.asUser(owner).post(`${BASE}/${classroomId}/topics`).send({ title: "Mechanics" });
    assert.equal(topicRes.status, 200);
    const topicId = topicRes.body.data._id;

    const otherTopicRes = await h.asUser(otherInstructor).post(`${BASE}/${otherClassroomId}/topics`).send({ title: "Acids" });
    const otherTopicId = otherTopicRes.body.data._id;

    return { owner, otherInstructor, studentA, studentB, outsider, admin, classroomId, otherClassroomId, inviteCode, topicId, otherTopicId };
}

async function createAssignment(ctx, overrides = {}) {
    const res = await h.asUser(ctx.owner).post(`${BASE}/topics/${ctx.topicId}/assignments`).send({
        title: "Homework 1",
        description: "Solve",
        points: 50,
        publish: true,
        ...overrides,
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data;
}

async function createPublishedQuiz(ctx, { publish = true } = {}) {
    const quizRes = await h.asUser(ctx.owner).post(`${BASE}/topics/${ctx.topicId}/quizzes`).send({ title: "Quiz 1" });
    assert.equal(quizRes.status, 200);
    const quizId = quizRes.body.data._id;
    const multiple = await h.asUser(ctx.owner).post(`${BASE}/quizzes/${quizId}/screens`).send({
        type: "multiple",
        body: "Pick B",
        options: [{ text: "A", correct: false }, { text: "B", correct: true }],
        properties: { points: 10 },
    });
    assert.equal(multiple.status, 200);
    const short = await h.asUser(ctx.owner).post(`${BASE}/quizzes/${quizId}/screens`).send({
        type: "short",
        body: "Capital of France",
        options: [{ text: "paris" }],
        properties: { points: 5 },
    });
    assert.equal(short.status, 200);
    if (publish) {
        const pub = await h.asUser(ctx.owner).patch(`${BASE}/quizzes/${quizId}`).send({ publish: true });
        assert.equal(pub.status, 200);
    }
    return { quizId, multipleId: multiple.body.data._id, shortId: short.body.data._id };
}

describe("classroom feature", () => {
    before(h.startTestEnvironment);
    after(h.stopTestEnvironment);
    beforeEach(h.resetDatabase);

    describe("authentication", () => {
        it("rejects unauthenticated requests on every classroom endpoint", async () => {
            const id = UNKNOWN_ID;
            const requests = [
                ["get", `${BASE}/my`],
                ["post", `${BASE}/join`],
                ["get", `${BASE}/${id}`],
                ["post", `${BASE}/${id}/add-member`],
                ["post", `${BASE}/${id}/remove-member`],
                ["get", `${BASE}/${id}/overview`],
                ["post", `${BASE}/${id}/announcements`],
                ["get", `${BASE}/${id}/announcements`],
                ["post", `${BASE}/${id}/topics`],
                ["get", `${BASE}/${id}/topics`],
                ["post", `${BASE}/${id}/topics/reorder`],
                ["patch", `${BASE}/topics/${id}`],
                ["delete", `${BASE}/topics/${id}`],
                ["post", `${BASE}/topics/${id}/items`],
                ["post", `${BASE}/topics/${id}/items/reorder`],
                ["delete", `${BASE}/topics/${id}/items/${id}`],
                ["post", `${BASE}/topics/${id}/items/${id}/copy`],
                ["get", `${BASE}/assignments/${id}`],
                ["delete", `${BASE}/assignments/${id}`],
                ["post", `${BASE}/assignments/${id}/submit`],
                ["get", `${BASE}/assignments/${id}/submissions`],
                ["get", `${BASE}/quizzes/${id}`],
                ["post", `${BASE}/quizzes/${id}/attempts`],
                ["get", `${BASE}/quizzes/${id}/leaderboard`],
            ];
            for (const [method, url] of requests) {
                const res = await h.api()[method](url).send({});
                assert.equal(res.status, 401, `${method} ${url}`);
            }
        });
    });

    describe("classroom lifecycle, membership and invite codes", () => {
        it("creates classrooms with a random 16 hex char invite code", async () => {
            const ctx = await seed();
            const classroom = await Classroom.findById(ctx.classroomId).lean();
            assert.match(classroom.inviteCode, /^[0-9a-f]{16}$/);
        });

        it("denies classroom creation to students", async () => {
            const student = await h.createUser();
            const res = await h.asUser(student).post(`${BASE}/create`).send({ title: "x" });
            assert.ok([401, 403].includes(res.status));
        });

        it("rejects empty or non-string classroom titles", async () => {
            const owner = await h.createUser({ accountType: "Instructor", approved: true });
            for (const title of ["", "   ", { a: 1 }, undefined]) {
                const res = await h.asUser(owner).post(`${BASE}/create`).send({ title });
                assert.equal(res.status, 400);
            }
        });

        it("getClassroom hides emails and invite code from students, shows them to staff and admin", async () => {
            const ctx = await seed();
            const studentView = await h.asUser(ctx.studentA).get(`${BASE}/${ctx.classroomId}`);
            assert.equal(studentView.status, 200);
            const serialized = JSON.stringify(studentView.body.data);
            assert.ok(!serialized.includes("@test.local"), "student view leaked an email");
            assert.equal(studentView.body.data.inviteCode, undefined);
            assert.ok(studentView.body.data.members.length >= 3);
            assert.ok(studentView.body.data.members[0].user.firstName);

            const ownerView = await h.asUser(ctx.owner).get(`${BASE}/${ctx.classroomId}`);
            assert.ok(JSON.stringify(ownerView.body.data).includes("@test.local"));
            assert.ok(ownerView.body.data.inviteCode);

            const adminView = await h.asUser(ctx.admin).get(`${BASE}/${ctx.classroomId}`);
            assert.equal(adminView.status, 200);
            assert.ok(adminView.body.data.inviteCode);
        });

        it("getClassroom returns 403 for non-members, 404 unknown, 400 malformed", async () => {
            const ctx = await seed();
            assert.equal((await h.asUser(ctx.outsider).get(`${BASE}/${ctx.classroomId}`)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).get(`${BASE}/${ctx.classroomId}`)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/${UNKNOWN_ID}`)).status, 404);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/${MALFORMED_ID}`)).status, 400);
        });

        it("getMyClassrooms hides member emails from students and tolerates regex metacharacters in search", async () => {
            const ctx = await seed();
            const res = await h.asUser(ctx.studentA).get(`${BASE}/my?search=(`);
            assert.equal(res.status, 200);
            const listed = await h.asUser(ctx.studentA).get(`${BASE}/my`);
            assert.equal(listed.body.data.length, 1);
            assert.ok(!JSON.stringify(listed.body.data).includes("@test.local"));
            assert.equal(listed.body.data[0].inviteCode, undefined);
        });

        it("instructor joining by invite code becomes a plain member, not a co-instructor", async () => {
            const ctx = await seed();
            const joinRes = await h.asUser(ctx.otherInstructor).post(`${BASE}/join`).send({ inviteCode: ctx.inviteCode });
            assert.equal(joinRes.status, 200);
            const classroom = await Classroom.findById(ctx.classroomId).lean();
            const entry = classroom.members.find((m) => String(m.user) === String(ctx.otherInstructor._id));
            assert.equal(entry.role, "Student");
            assert.equal(classroom.coInstructors.length, 0);
            const topicRes = await h.asUser(ctx.otherInstructor).post(`${BASE}/${ctx.classroomId}/topics`).send({ title: "Hijack" });
            assert.equal(topicRes.status, 403);
        });

        it("join returns 404 for unknown codes and 400 for malformed or operator payloads", async () => {
            const ctx = await seed();
            assert.equal((await h.asUser(ctx.outsider).post(`${BASE}/join`).send({ inviteCode: "ffffffffffffffff" })).status, 404);
            assert.equal((await h.asUser(ctx.outsider).post(`${BASE}/join`).send({})).status, 400);
            assert.equal((await h.asUser(ctx.outsider).post(`${BASE}/join`).send({ inviteCode: { $ne: null } })).status, 400);
            assert.equal((await h.asUser(ctx.outsider).post(`${BASE}/join`).send({ inviteCode: { a: 1 } })).status, 400);
        });

        it("joining twice is idempotent", async () => {
            const ctx = await seed();
            const again = await h.asUser(ctx.studentA).post(`${BASE}/join`).send({ inviteCode: ctx.inviteCode });
            assert.equal(again.status, 200);
            const classroom = await Classroom.findById(ctx.classroomId).lean();
            assert.equal(classroom.members.filter((m) => String(m.user) === String(ctx.studentA._id)).length, 1);
        });

        it("add-member route works (previously always 400) and promotes instructors only when the owner adds them", async () => {
            const ctx = await seed();
            const res = await h.asUser(ctx.owner).post(`${BASE}/${ctx.classroomId}/add-member`).send({ userIdToAdd: String(ctx.otherInstructor._id) });
            assert.equal(res.status, 200, JSON.stringify(res.body));
            const classroom = await Classroom.findById(ctx.classroomId).lean();
            const entry = classroom.members.find((m) => String(m.user) === String(ctx.otherInstructor._id));
            assert.equal(entry.role, "CoInstructor");
            assert.ok(classroom.coInstructors.map(String).includes(String(ctx.otherInstructor._id)));
            const topicRes = await h.asUser(ctx.otherInstructor).post(`${BASE}/${ctx.classroomId}/topics`).send({ title: "Co-taught" });
            assert.equal(topicRes.status, 200);
        });

        it("owner can upgrade an invite-joined instructor to co-instructor via add-member", async () => {
            const ctx = await seed();
            await h.asUser(ctx.otherInstructor).post(`${BASE}/join`).send({ inviteCode: ctx.inviteCode });
            const res = await h.asUser(ctx.owner).post(`${BASE}/${ctx.classroomId}/add-member`).send({ userIdToAdd: String(ctx.otherInstructor._id) });
            assert.equal(res.status, 200);
            const classroom = await Classroom.findById(ctx.classroomId).lean();
            assert.equal(classroom.members.find((m) => String(m.user) === String(ctx.otherInstructor._id)).role, "CoInstructor");
        });

        it("add-member is staff only and validates the target", async () => {
            const ctx = await seed();
            const url = `${BASE}/${ctx.classroomId}/add-member`;
            assert.equal((await h.asUser(ctx.studentA).post(url).send({ userIdToAdd: String(ctx.outsider._id) })).status, 403);
            assert.equal((await h.asUser(ctx.outsider).post(url).send({ userIdToAdd: String(ctx.outsider._id) })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(url).send({ userIdToAdd: String(ctx.outsider._id) })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ userIdToAdd: MALFORMED_ID })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ userIdToAdd: UNKNOWN_ID })).status, 404);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ userIdToAdd: { $ne: null } })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/${MALFORMED_ID}/add-member`).send({ userIdToAdd: String(ctx.outsider._id) })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/${UNKNOWN_ID}/add-member`).send({ userIdToAdd: String(ctx.outsider._id) })).status, 404);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ userIdToAdd: String(ctx.outsider._id) })).status, 200);
            const classroom = await Classroom.findById(ctx.classroomId).lean();
            assert.equal(classroom.members.find((m) => String(m.user) === String(ctx.outsider._id)).role, "Student");
        });

        it("remove-member works for staff, never removes the owner, and co-instructors cannot remove co-instructors", async () => {
            const ctx = await seed();
            const url = `${BASE}/${ctx.classroomId}/remove-member`;
            assert.equal((await h.asUser(ctx.studentA).post(url).send({ userIdToRemove: String(ctx.studentB._id) })).status, 403);
            assert.equal((await h.asUser(ctx.outsider).post(url).send({ userIdToRemove: String(ctx.studentB._id) })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ userIdToRemove: String(ctx.owner._id) })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ userIdToRemove: MALFORMED_ID })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ userIdToRemove: UNKNOWN_ID })).status, 404);

            const second = await h.createUser({ accountType: "Instructor", approved: true });
            await h.asUser(ctx.owner).post(`${BASE}/${ctx.classroomId}/add-member`).send({ userIdToAdd: String(ctx.otherInstructor._id) });
            await h.asUser(ctx.owner).post(`${BASE}/${ctx.classroomId}/add-member`).send({ userIdToAdd: String(second._id) });
            assert.equal((await h.asUser(ctx.otherInstructor).post(url).send({ userIdToRemove: String(second._id) })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(url).send({ userIdToRemove: String(ctx.studentB._id) })).status, 200);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ userIdToRemove: String(second._id) })).status, 200);

            const classroom = await Classroom.findById(ctx.classroomId).lean();
            assert.ok(!classroom.members.some((m) => String(m.user) === String(ctx.studentB._id)));
            assert.ok(!classroom.coInstructors.map(String).includes(String(second._id)));
            assert.equal((await h.asUser(ctx.studentB).get(`${BASE}/${ctx.classroomId}`)).status, 403);
        });
    });

    describe("overview, announcements and topics", () => {
        it("overview requires membership and hides unpublished assignments from students", async () => {
            const ctx = await seed();
            const future = new Date(Date.now() + 86400000).toISOString();
            await createAssignment(ctx, { title: "Draft", publish: false, dueDate: future });
            await createAssignment(ctx, { title: "Live", publish: true, dueDate: future });

            const studentRes = await h.asUser(ctx.studentA).get(`${BASE}/${ctx.classroomId}/overview`);
            assert.equal(studentRes.status, 200);
            assert.deepEqual(studentRes.body.data.upcomingAssignments.map((a) => a.title), ["Live"]);
            assert.equal(studentRes.body.data.counts.assignments, 1);
            assert.ok(!JSON.stringify(studentRes.body.data).includes("@test.local"));

            const staffRes = await h.asUser(ctx.owner).get(`${BASE}/${ctx.classroomId}/overview`);
            assert.equal(staffRes.body.data.upcomingAssignments.length, 2);

            assert.equal((await h.asUser(ctx.outsider).get(`${BASE}/${ctx.classroomId}/overview`)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).get(`${BASE}/${ctx.classroomId}/overview`)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/${UNKNOWN_ID}/overview`)).status, 404);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/${MALFORMED_ID}/overview`)).status, 400);
        });

        it("announcements: staff create, members read, everyone else denied", async () => {
            const ctx = await seed();
            const url = `${BASE}/${ctx.classroomId}/announcements`;
            assert.equal((await h.asUser(ctx.studentA).post(url).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(url).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(url).send({})).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ title: { $gt: "" } })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ title: { a: 1 } })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/${MALFORMED_ID}/announcements`).send({ title: "x" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/${UNKNOWN_ID}/announcements`).send({ title: "x" })).status, 404);
            const created = await h.asUser(ctx.owner).post(url).send({ title: "Exam", body: "Friday", pinned: true });
            assert.equal(created.status, 200);

            const list = await h.asUser(ctx.studentA).get(url);
            assert.equal(list.status, 200);
            assert.equal(list.body.data.length, 1);
            assert.equal((await h.asUser(ctx.outsider).get(url)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/${MALFORMED_ID}/announcements`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/${UNKNOWN_ID}/announcements`)).status, 404);
        });

        it("topics: create/update/delete/reorder are staff-of-that-classroom only", async () => {
            const ctx = await seed();
            const topicsUrl = `${BASE}/${ctx.classroomId}/topics`;
            assert.equal((await h.asUser(ctx.studentA).post(topicsUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(topicsUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(topicsUrl).send({})).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(topicsUrl).send({ title: { $gt: "" } })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/${MALFORMED_ID}/topics`).send({ title: "x" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/${UNKNOWN_ID}/topics`).send({ title: "x" })).status, 404);

            const second = await h.asUser(ctx.owner).post(topicsUrl).send({ title: "Waves" });
            assert.equal(second.status, 200);

            const topicUrl = `${BASE}/topics/${ctx.topicId}`;
            assert.equal((await h.asUser(ctx.studentA).patch(topicUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).patch(topicUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/topics/${MALFORMED_ID}`).send({ title: "x" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/topics/${UNKNOWN_ID}`).send({ title: "x" })).status, 404);
            assert.equal((await h.asUser(ctx.owner).patch(topicUrl).send({ status: "bogus" })).status, 400);
            const renamed = await h.asUser(ctx.owner).patch(topicUrl).send({ title: "Mechanics 2", status: "published" });
            assert.equal(renamed.status, 200);
            assert.equal(renamed.body.data.title, "Mechanics 2");

            const reorderUrl = `${BASE}/${ctx.classroomId}/topics/reorder`;
            const order = [second.body.data._id, ctx.topicId];
            assert.equal((await h.asUser(ctx.studentA).post(reorderUrl).send({ order })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(reorderUrl).send({ order })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(reorderUrl).send({ order: [MALFORMED_ID] })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(reorderUrl).send({ order })).status, 200);
            const listed = await h.asUser(ctx.studentA).get(topicsUrl);
            assert.deepEqual(listed.body.data.map((t) => t._id), order);

            assert.equal((await h.asUser(ctx.studentA).delete(topicUrl)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).delete(topicUrl)).status, 403);
            assert.equal((await h.asUser(ctx.owner).delete(`${BASE}/topics/${UNKNOWN_ID}`)).status, 404);
            assert.equal((await h.asUser(ctx.owner).delete(topicUrl)).status, 200);
            assert.equal(await Topic.countDocuments({ _id: ctx.topicId }), 0);
        });

        it("listTopics requires membership and only shows published items to students", async () => {
            const ctx = await seed();
            const published = await h.asUser(ctx.owner).post(`${BASE}/topics/${ctx.topicId}/items`).send({ type: "material", title: "Notes" });
            await h.asUser(ctx.owner).post(`${BASE}/topics/${ctx.topicId}/items`).send({ type: "material", title: "Secret draft" });
            await h.asUser(ctx.owner).patch(`${BASE}/topics/${ctx.topicId}/items/${published.body.data._id}/toggle`);

            const studentList = await h.asUser(ctx.studentA).get(`${BASE}/${ctx.classroomId}/topics`);
            assert.deepEqual(studentList.body.data[0].items.map((i) => i.title), ["Notes"]);
            const staffList = await h.asUser(ctx.owner).get(`${BASE}/${ctx.classroomId}/topics`);
            assert.equal(staffList.body.data[0].items.length, 2);
            assert.equal((await h.asUser(ctx.outsider).get(`${BASE}/${ctx.classroomId}/topics`)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/${MALFORMED_ID}/topics`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/${UNKNOWN_ID}/topics`)).status, 404);
        });

        it("deleting a topic cascades to assignments, submissions, quizzes and attempts", async () => {
            const ctx = await seed();
            const assignment = await createAssignment(ctx);
            await h.asUser(ctx.studentA).post(`${BASE}/assignments/${assignment._id}/submit`).send({ content: "answer" });
            const { quizId, multipleId } = await createPublishedQuiz(ctx);
            await h.asUser(ctx.studentA).post(`${BASE}/quizzes/${quizId}/attempts`).send({ answers: [{ screenId: multipleId, provided: "1" }] });
            assert.equal(await Submission.countDocuments(), 1);
            assert.equal(await Attempt.countDocuments(), 1);

            assert.equal((await h.asUser(ctx.owner).delete(`${BASE}/topics/${ctx.topicId}`)).status, 200);
            assert.equal(await Assignment.countDocuments(), 0);
            assert.equal(await Submission.countDocuments(), 0);
            assert.equal(await Quiz.countDocuments(), 0);
            assert.equal(await Attempt.countDocuments(), 0);
        });
    });

    describe("topic items (previously unrouted)", () => {
        async function addItem(ctx, title) {
            const res = await h.asUser(ctx.owner).post(`${BASE}/topics/${ctx.topicId}/items`).send({ type: "material", title });
            assert.equal(res.status, 200, JSON.stringify(res.body));
            return res.body.data;
        }

        it("creates, reorders, copies and deletes items for staff only", async () => {
            const ctx = await seed();
            const first = await addItem(ctx, "One");
            const second = await addItem(ctx, "Two");
            const itemsUrl = `${BASE}/topics/${ctx.topicId}/items`;

            assert.equal((await h.asUser(ctx.studentA).post(itemsUrl).send({ type: "material", title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(itemsUrl).send({ type: "material", title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(itemsUrl).send({ type: "material" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(itemsUrl).send({ type: "material", title: "x", link: "javascript:alert(1)" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(itemsUrl).send({ type: "bogus", title: "x" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/topics/${MALFORMED_ID}/items`).send({ type: "material", title: "x" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/topics/${UNKNOWN_ID}/items`).send({ type: "material", title: "x" })).status, 404);

            const order = [second._id, first._id];
            assert.equal((await h.asUser(ctx.studentA).post(`${itemsUrl}/reorder`).send({ order })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(`${itemsUrl}/reorder`).send({ order })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(`${itemsUrl}/reorder`).send({ order: "nope" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${itemsUrl}/reorder`).send({ order })).status, 200);
            let topic = await Topic.findById(ctx.topicId).lean();
            assert.deepEqual(topic.items.map((i) => String(i._id)), order);

            const copyUrl = `${itemsUrl}/${first._id}/copy`;
            assert.equal((await h.asUser(ctx.studentA).post(copyUrl).send({ destTopicId: ctx.topicId })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(copyUrl).send({ destTopicId: ctx.otherTopicId })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(copyUrl).send({ destTopicId: MALFORMED_ID })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(copyUrl).send({ destTopicId: UNKNOWN_ID })).status, 404);
            const copied = await h.asUser(ctx.owner).post(copyUrl).send({ destTopicId: ctx.topicId });
            assert.equal(copied.status, 200);
            assert.equal(copied.body.data.title, "One (copy)");

            const deleteUrl = `${itemsUrl}/${first._id}`;
            assert.equal((await h.asUser(ctx.studentA).delete(deleteUrl)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).delete(deleteUrl)).status, 403);
            assert.equal((await h.asUser(ctx.owner).delete(`${itemsUrl}/${MALFORMED_ID}`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).delete(`${itemsUrl}/${UNKNOWN_ID}`)).status, 404);
            assert.equal((await h.asUser(ctx.owner).delete(deleteUrl)).status, 200);
            topic = await Topic.findById(ctx.topicId).lean();
            assert.equal(topic.items.length, 2);
            assert.deepEqual(topic.items.map((i) => i.position), [1, 2]);
        });

        it("update and toggle are staff of that classroom only", async () => {
            const ctx = await seed();
            const item = await addItem(ctx, "One");
            const updateUrl = `${BASE}/topics/${ctx.topicId}/items/${item._id}`;
            assert.equal((await h.asUser(ctx.studentA).patch(updateUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).patch(updateUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).patch(`${updateUrl}/toggle`)).status, 403);
            assert.equal((await h.asUser(ctx.studentA).patch(`${updateUrl}/toggle`)).status, 403);
            assert.equal((await h.asUser(ctx.owner).patch(updateUrl).send({ removeAttachments: { a: 1 } })).status, 400);
            const updated = await h.asUser(ctx.owner).patch(updateUrl).send({ title: "Renamed" });
            assert.equal(updated.body.data.title, "Renamed");
            const toggled = await h.asUser(ctx.owner).patch(`${updateUrl}/toggle`);
            assert.equal(toggled.body.data.status, "published");
        });
    });

    describe("assignments, submissions and grading", () => {
        it("create/update/delete assignments are staff of that classroom only and validate input", async () => {
            const ctx = await seed();
            const url = `${BASE}/topics/${ctx.topicId}/assignments`;
            assert.equal((await h.asUser(ctx.studentA).post(url).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.outsider).post(url).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(url).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(url).send({})).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ title: "x", points: -3 })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ title: "x", dueDate: "garbage" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ title: "x", assigneeType: "everyone" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ title: "x", assignees: [MALFORMED_ID] })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ title: "x", assigneeType: "selected", assignees: [String(ctx.outsider._id)] })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/topics/${MALFORMED_ID}/assignments`).send({ title: "x" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/topics/${UNKNOWN_ID}/assignments`).send({ title: "x" })).status, 404);

            const assignment = await createAssignment(ctx);
            const topic = await Topic.findById(ctx.topicId).lean();
            assert.equal(topic.assignmentsCount, 1);

            const assignmentUrl = `${BASE}/assignments/${assignment._id}`;
            assert.equal((await h.asUser(ctx.studentA).patch(assignmentUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).patch(assignmentUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/assignments/${UNKNOWN_ID}`).send({ title: "x" })).status, 404);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/assignments/${MALFORMED_ID}`).send({ title: "x" })).status, 400);
            const updated = await h.asUser(ctx.owner).patch(assignmentUrl).send({ title: "Renamed", publish: "false", points: 80 });
            assert.equal(updated.body.data.title, "Renamed");
            assert.equal(updated.body.data.publish, false);
            assert.equal(updated.body.data.points, 80);

            assert.equal((await h.asUser(ctx.studentA).delete(assignmentUrl)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).delete(assignmentUrl)).status, 403);
            assert.equal((await h.asUser(ctx.owner).delete(`${BASE}/assignments/${UNKNOWN_ID}`)).status, 404);
            assert.equal((await h.asUser(ctx.owner).delete(`${BASE}/assignments/${MALFORMED_ID}`)).status, 400);
        });

        it("deleteAssignment cascades submissions and decrements the topic counter", async () => {
            const ctx = await seed();
            const assignment = await createAssignment(ctx);
            await h.asUser(ctx.studentA).post(`${BASE}/assignments/${assignment._id}/submit`).send({ content: "mine" });
            await h.asUser(ctx.studentB).post(`${BASE}/assignments/${assignment._id}/submit`).send({ content: "mine too" });
            assert.equal(await Submission.countDocuments(), 2);

            const res = await h.asUser(ctx.owner).delete(`${BASE}/assignments/${assignment._id}`);
            assert.equal(res.status, 200);
            assert.equal(await Assignment.countDocuments(), 0);
            assert.equal(await Submission.countDocuments(), 0);
            assert.equal((await Topic.findById(ctx.topicId).lean()).assignmentsCount, 0);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/assignments/${assignment._id}`)).status, 404);
        });

        it("reads: members only; students cannot see drafts or assignments not targeted at them", async () => {
            const ctx = await seed();
            const draft = await createAssignment(ctx, { title: "Draft", publish: false });
            const live = await createAssignment(ctx, { title: "Live" });
            const targeted = await createAssignment(ctx, {
                title: "Only A",
                assigneeType: "selected",
                assignees: [String(ctx.studentA._id)],
            });

            assert.equal((await h.asUser(ctx.outsider).get(`${BASE}/assignments/${live._id}`)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).get(`${BASE}/assignments/${live._id}`)).status, 403);
            assert.equal((await h.asUser(ctx.studentA).get(`${BASE}/assignments/${draft._id}`)).status, 404);
            assert.equal((await h.asUser(ctx.studentA).get(`${BASE}/assignments/${live._id}`)).status, 200);
            assert.equal((await h.asUser(ctx.studentA).get(`${BASE}/assignments/${targeted._id}`)).status, 200);
            assert.equal((await h.asUser(ctx.studentB).get(`${BASE}/assignments/${targeted._id}`)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/assignments/${draft._id}`)).status, 200);
            assert.equal((await h.asUser(ctx.admin).get(`${BASE}/assignments/${draft._id}`)).status, 200);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/assignments/${MALFORMED_ID}`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/assignments/${UNKNOWN_ID}`)).status, 404);

            const listUrl = `${BASE}/topics/${ctx.topicId}/assignments`;
            const asTitles = (res) => res.body.data.map((a) => a.title).sort();
            assert.deepEqual(asTitles(await h.asUser(ctx.studentA).get(listUrl)), ["Live", "Only A"]);
            assert.deepEqual(asTitles(await h.asUser(ctx.studentB).get(listUrl)), ["Live"]);
            assert.deepEqual(asTitles(await h.asUser(ctx.studentB).get(`${listUrl}/published`)), ["Live"]);
            assert.deepEqual(asTitles(await h.asUser(ctx.owner).get(listUrl)), ["Draft", "Live", "Only A"]);
            assert.deepEqual(asTitles(await h.asUser(ctx.owner).get(`${listUrl}/published`)), ["Live", "Only A"]);
            assert.equal((await h.asUser(ctx.outsider).get(listUrl)).status, 403);
            assert.equal((await h.asUser(ctx.outsider).get(`${listUrl}/published`)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/topics/${MALFORMED_ID}/assignments`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/topics/${UNKNOWN_ID}/assignments`)).status, 404);
        });

        it("submit: only targeted students of that classroom, published, unlocked and before the due date", async () => {
            const ctx = await seed();
            const live = await createAssignment(ctx);
            const submitUrl = (assignment) => `${BASE}/assignments/${assignment._id}/submit`;

            assert.equal((await h.asUser(ctx.outsider).post(submitUrl(live)).send({ content: "hi" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(submitUrl(live)).send({ content: "hi" })).status, 403);
            assert.equal((await h.asUser(ctx.admin).post(submitUrl(live)).send({ content: "hi" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(submitUrl(live)).send({ content: "hi" })).status, 403);
            assert.equal((await h.asUser(ctx.studentA).post(`${BASE}/assignments/${MALFORMED_ID}/submit`).send({ content: "hi" })).status, 400);
            assert.equal((await h.asUser(ctx.studentA).post(`${BASE}/assignments/${UNKNOWN_ID}/submit`).send({ content: "hi" })).status, 404);
            assert.equal((await h.asUser(ctx.studentA).post(submitUrl(live)).send({})).status, 400);
            assert.equal((await h.asUser(ctx.studentA).post(submitUrl(live)).send({ content: { a: 1 } })).status, 400);
            assert.equal((await h.asUser(ctx.studentA).post(submitUrl(live)).send({ content: "x", removeAttachments: { a: 1 } })).status, 400);
            assert.equal((await h.asUser(ctx.studentA).post(submitUrl(live)).send({ content: "x", removeAttachments: [1, 2] })).status, 400);

            const draft = await createAssignment(ctx, { publish: false });
            assert.equal((await h.asUser(ctx.studentA).post(submitUrl(draft)).send({ content: "hi" })).status, 404);

            const targeted = await createAssignment(ctx, { assigneeType: "selected", assignees: [String(ctx.studentA._id)] });
            assert.equal((await h.asUser(ctx.studentB).post(submitUrl(targeted)).send({ content: "hi" })).status, 403);
            assert.equal((await h.asUser(ctx.studentA).post(submitUrl(targeted)).send({ content: "hi" })).status, 200);

            const locked = await createAssignment(ctx, { lockSubmissions: true });
            assert.equal((await h.asUser(ctx.studentA).post(submitUrl(locked)).send({ content: "hi" })).status, 403);

            const overdue = await createAssignment(ctx);
            await Assignment.updateOne({ _id: overdue._id }, { $set: { dueDate: new Date(Date.now() - 60000) } });
            assert.equal((await h.asUser(ctx.studentA).post(submitUrl(overdue)).send({ content: "hi" })).status, 403);

            assert.equal(await Submission.countDocuments({ assignment: { $in: [draft._id, locked._id, overdue._id] } }), 0);
        });

        it("keeps one submission per student per assignment, allowing revision until graded", async () => {
            const ctx = await seed();
            const assignment = await createAssignment(ctx);
            const url = `${BASE}/assignments/${assignment._id}/submit`;
            const first = await h.asUser(ctx.studentA).post(url).send({ content: "v1" });
            assert.equal(first.status, 200);
            const second = await h.asUser(ctx.studentA).post(url).send({ content: "v2" });
            assert.equal(second.status, 200);
            assert.equal(first.body.data._id, second.body.data._id);
            assert.equal(await Submission.countDocuments({ assignment: assignment._id, student: ctx.studentA._id }), 1);
            assert.equal(second.body.data.content, "v2");

            await h.asUser(ctx.owner).patch(`${BASE}/assignments/${assignment._id}/submissions/${first.body.data._id}`).send({ grade: 10 });
            assert.equal((await h.asUser(ctx.studentA).post(url).send({ content: "v3" })).status, 409);
        });

        it("the database refuses duplicate (assignment, student) submissions", async () => {
            const ctx = await seed();
            const assignment = await createAssignment(ctx);
            await Submission.init();
            await Submission.create({ assignment: assignment._id, student: ctx.studentA._id, content: "a" });
            await assert.rejects(Submission.create({ assignment: assignment._id, student: ctx.studentA._id, content: "b" }), /E11000/);
        });

        it("getMySubmission is members only and returns only the caller's submission", async () => {
            const ctx = await seed();
            const assignment = await createAssignment(ctx);
            await h.asUser(ctx.studentA).post(`${BASE}/assignments/${assignment._id}/submit`).send({ content: "A's work" });
            const url = `${BASE}/assignments/${assignment._id}/submission`;
            assert.equal((await h.asUser(ctx.studentA).get(url)).body.data.content, "A's work");
            assert.equal((await h.asUser(ctx.studentB).get(url)).body.data, null);
            assert.equal((await h.asUser(ctx.outsider).get(url)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/assignments/${MALFORMED_ID}/submission`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/assignments/${UNKNOWN_ID}/submission`)).status, 404);
        });

        it("getSubmissions is staff of that classroom only", async () => {
            const ctx = await seed();
            const assignment = await createAssignment(ctx);
            await h.asUser(ctx.studentA).post(`${BASE}/assignments/${assignment._id}/submit`).send({ content: "A" });
            const url = `${BASE}/assignments/${assignment._id}/submissions`;
            assert.equal((await h.asUser(ctx.studentB).get(url)).status, 403);
            assert.equal((await h.asUser(ctx.studentA).get(url)).status, 403);
            assert.equal((await h.asUser(ctx.outsider).get(url)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).get(url)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/assignments/${UNKNOWN_ID}/submissions`)).status, 404);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/assignments/${MALFORMED_ID}/submissions`)).status, 400);
            const staff = await h.asUser(ctx.owner).get(url);
            assert.equal(staff.status, 200);
            assert.equal(staff.body.data.length, 1);
            assert.equal((await h.asUser(ctx.admin).get(url)).status, 200);
        });

        it("grading is staff only, and grade must be a number within 0..points", async () => {
            const ctx = await seed();
            const assignment = await createAssignment(ctx, { points: 50 });
            const submit = await h.asUser(ctx.studentA).post(`${BASE}/assignments/${assignment._id}/submit`).send({ content: "A" });
            const url = `${BASE}/assignments/${assignment._id}/submissions/${submit.body.data._id}`;

            assert.equal((await h.asUser(ctx.studentA).patch(url).send({ grade: 50 })).status, 403);
            assert.equal((await h.asUser(ctx.studentB).patch(url).send({ grade: 50 })).status, 403);
            assert.equal((await h.asUser(ctx.outsider).patch(url).send({ grade: 50 })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).patch(url).send({ grade: 50 })).status, 403);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/assignments/${assignment._id}/submissions/${MALFORMED_ID}`).send({ grade: 5 })).status, 400);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/assignments/${assignment._id}/submissions/${UNKNOWN_ID}`).send({ grade: 5 })).status, 404);

            for (const grade of [51, -1, "abc", true, [5], { a: 1 }, "1e999"]) {
                const res = await h.asUser(ctx.owner).patch(url).send({ grade });
                assert.equal(res.status, 400, `grade ${JSON.stringify(grade)}`);
            }
            assert.equal((await Submission.findById(submit.body.data._id).lean()).grade, null);

            const ok = await h.asUser(ctx.owner).patch(url).send({ grade: 42, feedback: "good" });
            assert.equal(ok.status, 200);
            assert.equal(ok.body.data.grade, 42);
            assert.equal(String(ok.body.data.gradedBy._id), String(ctx.owner._id));
            assert.equal((await h.asUser(ctx.owner).patch(url).send({ grade: "50" })).body.data.grade, 50);
            assert.equal((await h.asUser(ctx.owner).patch(url).send({ grade: 0 })).body.data.grade, 0);
            assert.equal((await h.asUser(ctx.owner).patch(url).send({ grade: null })).body.data.grade, null);
        });

        it("a submission id from another assignment cannot be graded through a different assignment path", async () => {
            const ctx = await seed();
            const first = await createAssignment(ctx);
            const second = await createAssignment(ctx, { title: "Second" });
            const submit = await h.asUser(ctx.studentA).post(`${BASE}/assignments/${first._id}/submit`).send({ content: "A" });
            const res = await h.asUser(ctx.owner).patch(`${BASE}/assignments/${second._id}/submissions/${submit.body.data._id}`).send({ grade: 5 });
            assert.equal(res.status, 404);
        });
    });

    describe("quizzes and attempts", () => {
        it("quiz management is staff of that classroom only", async () => {
            const ctx = await seed();
            const url = `${BASE}/topics/${ctx.topicId}/quizzes`;
            assert.equal((await h.asUser(ctx.studentA).post(url).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(url).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(url).send({})).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(url).send({ title: { $ne: 1 } })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/topics/${MALFORMED_ID}/quizzes`).send({ title: "x" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(`${BASE}/topics/${UNKNOWN_ID}/quizzes`).send({ title: "x" })).status, 404);

            const { quizId, multipleId } = await createPublishedQuiz(ctx);
            const quizUrl = `${BASE}/quizzes/${quizId}`;
            assert.equal((await h.asUser(ctx.studentA).patch(quizUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).patch(quizUrl).send({ title: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/quizzes/${UNKNOWN_ID}`).send({ title: "x" })).status, 404);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/quizzes/${MALFORMED_ID}`).send({ title: "x" })).status, 400);

            const screensUrl = `${quizUrl}/screens`;
            assert.equal((await h.asUser(ctx.studentA).post(screensUrl).send({ type: "multiple" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(screensUrl).send({ type: "multiple" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(screensUrl).send({})).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(screensUrl).send({ type: "bogus" })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(screensUrl).send({ type: "multiple", options: "x" })).status, 400);

            const screenUrl = `${BASE}/quizzes/screens/${multipleId}`;
            assert.equal((await h.asUser(ctx.studentA).patch(screenUrl).send({ body: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).patch(screenUrl).send({ body: "x" })).status, 403);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/quizzes/screens/${UNKNOWN_ID}`).send({ body: "x" })).status, 404);
            assert.equal((await h.asUser(ctx.owner).patch(`${BASE}/quizzes/screens/${MALFORMED_ID}`).send({ body: "x" })).status, 400);
            const updated = await h.asUser(ctx.owner).patch(screenUrl).send({ body: "New body", properties: { points: 20 } });
            assert.equal(updated.body.data.body, "New body");
            assert.equal(updated.body.data.properties.points, 20);
            assert.equal(updated.body.data.options.length, 2);

            const stored = await Quiz.findById(quizId).lean();
            const reorder = stored.screens.map((s) => String(s._id)).reverse();
            const reorderUrl = `${screensUrl}/reorder`;
            assert.equal((await h.asUser(ctx.studentA).post(reorderUrl).send({ order: reorder })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(reorderUrl).send({ order: reorder })).status, 403);
            assert.equal((await h.asUser(ctx.owner).post(reorderUrl).send({ order: [MALFORMED_ID] })).status, 400);
            assert.equal((await h.asUser(ctx.owner).post(reorderUrl).send({ order: reorder })).status, 200);
            assert.deepEqual((await Quiz.findById(quizId).lean()).screens.map((s) => String(s._id)), reorder);

            assert.equal((await h.asUser(ctx.studentA).delete(`${screensUrl}/${multipleId}`)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).delete(`${screensUrl}/${multipleId}`)).status, 403);
            assert.equal((await h.asUser(ctx.owner).delete(`${screensUrl}/${UNKNOWN_ID}`)).status, 404);
            assert.equal((await h.asUser(ctx.owner).delete(`${screensUrl}/${MALFORMED_ID}`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).delete(`${screensUrl}/${multipleId}`)).status, 200);

            assert.equal((await h.asUser(ctx.studentA).delete(quizUrl)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).delete(quizUrl)).status, 403);
            assert.equal((await h.asUser(ctx.owner).delete(`${BASE}/quizzes/${UNKNOWN_ID}`)).status, 404);
            assert.equal((await h.asUser(ctx.owner).delete(quizUrl)).status, 200);
        });

        it("students never receive answer keys from getQuiz or the list endpoints; staff do", async () => {
            const ctx = await seed();
            const { quizId } = await createPublishedQuiz(ctx);

            const studentQuiz = await h.asUser(ctx.studentA).get(`${BASE}/quizzes/${quizId}`);
            assert.equal(studentQuiz.status, 200);
            const multiple = studentQuiz.body.data.screens.find((s) => s.type === "multiple");
            assert.equal(multiple.options.length, 2);
            assert.ok(multiple.options.every((o) => o.correct === undefined));
            assert.deepEqual(studentQuiz.body.data.screens.find((s) => s.type === "short").options, []);
            assert.ok(!JSON.stringify(studentQuiz.body.data).includes("paris"));

            for (const path of ["quizzes/published", "quizzes"]) {
                const listed = await h.asUser(ctx.studentA).get(`${BASE}/topics/${ctx.topicId}/${path}`);
                assert.equal(listed.status, 200);
                assert.equal(listed.body.data.length, 1);
                assert.ok(!JSON.stringify(listed.body.data).includes("paris"));
                assert.ok(!JSON.stringify(listed.body.data).includes('"correct"'));
            }

            const staffQuiz = await h.asUser(ctx.owner).get(`${BASE}/quizzes/${quizId}`);
            assert.equal(staffQuiz.body.data.screens.find((s) => s.type === "multiple").options[1].correct, true);
            const staffList = await h.asUser(ctx.owner).get(`${BASE}/topics/${ctx.topicId}/quizzes`);
            assert.ok(JSON.stringify(staffList.body.data).includes("paris"));

            assert.equal((await h.asUser(ctx.outsider).get(`${BASE}/quizzes/${quizId}`)).status, 403);
            assert.equal((await h.asUser(ctx.outsider).get(`${BASE}/topics/${ctx.topicId}/quizzes/published`)).status, 403);
            assert.equal((await h.asUser(ctx.outsider).get(`${BASE}/topics/${ctx.topicId}/quizzes`)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/quizzes/${UNKNOWN_ID}`)).status, 404);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/quizzes/${MALFORMED_ID}`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/topics/${MALFORMED_ID}/quizzes`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/topics/${UNKNOWN_ID}/quizzes/published`)).status, 404);
        });

        it("unpublished quizzes are invisible to students", async () => {
            const ctx = await seed();
            const { quizId } = await createPublishedQuiz(ctx, { publish: false });
            assert.equal((await h.asUser(ctx.studentA).get(`${BASE}/quizzes/${quizId}`)).status, 404);
            assert.equal((await h.asUser(ctx.studentA).get(`${BASE}/topics/${ctx.topicId}/quizzes`)).body.data.length, 0);
            assert.equal((await h.asUser(ctx.studentA).get(`${BASE}/quizzes/${quizId}/leaderboard`)).status, 404);
            assert.equal((await h.asUser(ctx.studentA).post(`${BASE}/quizzes/${quizId}/attempts`).send({ answers: [] })).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/quizzes/${quizId}`)).status, 200);
        });

        it("grades attempts server-side, ignores re-answers, derives timeTaken on the server and rejects posts after finish", async () => {
            const ctx = await seed();
            const { quizId, multipleId, shortId } = await createPublishedQuiz(ctx);
            const url = `${BASE}/quizzes/${quizId}/attempts`;

            assert.equal((await h.asUser(ctx.outsider).post(url).send({ answers: [] })).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).post(url).send({ answers: [] })).status, 403);
            assert.equal((await h.asUser(ctx.studentA).post(`${BASE}/quizzes/${MALFORMED_ID}/attempts`).send({})).status, 400);
            assert.equal((await h.asUser(ctx.studentA).post(`${BASE}/quizzes/${UNKNOWN_ID}/attempts`).send({})).status, 404);
            assert.equal((await h.asUser(ctx.studentA).post(url).send({ answers: "nope" })).status, 400);
            assert.equal((await h.asUser(ctx.studentA).post(url).send({ answers: [{ screenId: MALFORMED_ID, provided: "1" }] })).status, 400);
            assert.equal((await h.asUser(ctx.studentA).post(url).send({ answers: [{ screenId: multipleId, provided: { a: 1 } }] })).status, 400);
            assert.equal(await Attempt.countDocuments(), 0);

            const first = await h.asUser(ctx.studentA).post(url).send({
                answers: [{ screenId: multipleId, provided: "1", timeTaken: 0 }],
            });
            assert.equal(first.status, 200);
            assert.equal(first.body.data.answers[0].correct, true);
            assert.equal(first.body.data.totalPoints, 10);

            const second = await h.asUser(ctx.studentA).post(url).send({
                answers: [
                    { screenId: multipleId, provided: "0", timeTaken: 0 },
                    { screenId: shortId, provided: " Paris ", timeTaken: 9999 },
                ],
            });
            assert.equal(second.status, 200);
            const byScreen = Object.fromEntries(second.body.data.answers.map((a) => [String(a.screenId), a]));
            assert.equal(byScreen[multipleId].correct, true, "first answer must not be overwritten");
            assert.equal(byScreen[shortId].correct, true);
            assert.ok(byScreen[shortId].timeTaken < 30, `timeTaken was ${byScreen[shortId].timeTaken}`);
            assert.equal(second.body.data.totalPoints, 15);
            assert.equal(second.body.data.finishedAt, null);

            const finish = await h.asUser(ctx.studentA).post(url).send({ answers: [], finish: true });
            assert.equal(finish.status, 200);
            assert.ok(finish.body.data.finishedAt);
            assert.equal(finish.body.data.totalPoints, 15);

            const again = await h.asUser(ctx.studentA).post(url).send({ answers: [{ screenId: shortId, provided: "x" }] });
            assert.equal(again.status, 409);
            const stored = await Attempt.findOne({ quiz: quizId, user: ctx.studentA._id }).lean();
            assert.equal(stored.totalPoints, 15);
            assert.equal(await Attempt.countDocuments(), 1);

            const afterFinish = await h.asUser(ctx.studentA).get(`${BASE}/quizzes/${quizId}`);
            assert.equal(afterFinish.body.data.screens.find((s) => s.type === "multiple").options[1].correct, true);
            const stillHidden = await h.asUser(ctx.studentB).get(`${BASE}/quizzes/${quizId}`);
            assert.ok(stillHidden.body.data.screens.every((s) => (s.options || []).every((o) => o.correct === undefined)));
        });

        it("leaderboard is members only and ranks by score", async () => {
            const ctx = await seed();
            const { quizId, multipleId } = await createPublishedQuiz(ctx);
            const url = `${BASE}/quizzes/${quizId}/attempts`;
            await h.asUser(ctx.studentA).post(url).send({ answers: [{ screenId: multipleId, provided: "1" }], finish: true });
            await h.asUser(ctx.studentB).post(url).send({ answers: [{ screenId: multipleId, provided: "0" }], finish: true });

            const board = await h.asUser(ctx.studentB).get(`${BASE}/quizzes/${quizId}/leaderboard`);
            assert.equal(board.status, 200);
            assert.equal(board.body.data.board[0].id, String(ctx.studentA._id));
            assert.equal(board.body.data.me.rank, 2);
            assert.equal((await h.asUser(ctx.outsider).get(`${BASE}/quizzes/${quizId}/leaderboard`)).status, 403);
            assert.equal((await h.asUser(ctx.otherInstructor).get(`${BASE}/quizzes/${quizId}/leaderboard`)).status, 403);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/quizzes/${MALFORMED_ID}/leaderboard`)).status, 400);
            assert.equal((await h.asUser(ctx.owner).get(`${BASE}/quizzes/${UNKNOWN_ID}/leaderboard`)).status, 404);
        });

        it("the database refuses a second attempt document for the same user and quiz", async () => {
            const ctx = await seed();
            const { quizId } = await createPublishedQuiz(ctx);
            await Attempt.init();
            await Attempt.create({ quiz: quizId, user: ctx.studentA._id });
            await assert.rejects(Attempt.create({ quiz: quizId, user: ctx.studentA._id }), /E11000/);
        });
    });

    describe("error hygiene", () => {
        it("never echoes internal error messages on 500", async () => {
            const ctx = await seed();
            const original = Topic.find;
            Topic.find = () => {
                throw new Error("secret internal detail");
            };
            const silence = console.error;
            console.error = () => {};
            try {
                const res = await h.asUser(ctx.studentA).get(`${BASE}/${ctx.classroomId}/topics`);
                assert.equal(res.status, 500);
                assert.ok(!JSON.stringify(res.body).includes("secret internal detail"));
            } finally {
                Topic.find = original;
                console.error = silence;
            }
        });
    });
});
