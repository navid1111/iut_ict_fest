import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { userService } from "../services/userService.js";

const app = createApp();

describe("Users API", () => {
  beforeEach(() => {
    userService.reset();
  });

  it("starts with an empty list", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("creates a user", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Ada", email: "ada@example.com" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Ada", email: "ada@example.com" });
    expect(res.body.id).toBeTypeOf("string");
  });

  it("rejects invalid payloads with 400", async () => {
    const res = await request(app).post("/api/users").send({ name: "no email" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it("fetches a user by id", async () => {
    const created = await request(app)
      .post("/api/users")
      .send({ name: "Linus", email: "linus@example.com" });

    const res = await request(app).get(`/api/users/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it("returns 404 for a missing user", async () => {
    const res = await request(app).get("/api/users/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("deletes a user", async () => {
    const created = await request(app)
      .post("/api/users")
      .send({ name: "Grace", email: "grace@example.com" });

    const del = await request(app).delete(`/api/users/${created.body.id}`);
    expect(del.status).toBe(204);

    const after = await request(app).get(`/api/users/${created.body.id}`);
    expect(after.status).toBe(404);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
