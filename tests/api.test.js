import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("axios", () => {
  const create = vi.fn(() => instance);
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { default: { create }, create };
});

import axios from "axios";
import { tasksApi } from "../src/services/api.js";

const httpMock = axios.create.mock.results[0]?.value;

beforeEach(() => {
  Object.values(httpMock).forEach((fn) => fn.mockReset?.());
});

describe("tasksApi", () => {
  it("list() returns task array on success", async () => {
    httpMock.get.mockResolvedValueOnce({ data: [{ id: "1", title: "x", status: "pending" }] });
    const data = await tasksApi.list();
    expect(httpMock.get).toHaveBeenCalledWith("/tasks");
    expect(data).toHaveLength(1);
  });

  it("list() throws a friendly error when the network is down", async () => {
    httpMock.get.mockRejectedValueOnce({ request: {}, message: "Network Error" });
    await expect(tasksApi.list()).rejects.toThrow(/could not reach the api/i);
  });

  it("create() posts the payload", async () => {
    httpMock.post.mockResolvedValueOnce({ data: { id: "new", title: "t", status: "pending" } });
    const created = await tasksApi.create({ title: "t" });
    expect(httpMock.post).toHaveBeenCalledWith("/tasks", expect.objectContaining({ title: "t" }));
    expect(created.id).toBe("new");
  });

  it("update() sends a PUT to the right URL", async () => {
    httpMock.put.mockResolvedValueOnce({ data: { id: "abc", status: "done" } });
    await tasksApi.update("abc", { status: "done" });
    expect(httpMock.put).toHaveBeenCalledWith("/tasks/abc", { status: "done" });
  });

  it("remove() sends a DELETE", async () => {
    httpMock.delete.mockResolvedValueOnce({});
    await tasksApi.remove("xyz");
    expect(httpMock.delete).toHaveBeenCalledWith("/tasks/xyz");
  });

  it("surfaces backend detail messages", async () => {
    httpMock.get.mockRejectedValueOnce({
      response: { status: 404, data: { detail: "task not found" } },
    });
    await expect(tasksApi.list()).rejects.toThrow(/task not found/i);
  });
});
