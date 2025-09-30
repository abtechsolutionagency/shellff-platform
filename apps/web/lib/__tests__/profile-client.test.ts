import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  type ProfileApiResponse,
  type UpdateProfileResponse,
} from "../profile-client";

describe("profile-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches profile data successfully", async () => {
    const mockResponse: ProfileApiResponse = {
      user: {
        id: "1",
        email: "user@example.com",
        username: "tester",
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchProfile();

    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledWith("/api/profile", { signal: undefined });
  });

  it("throws a descriptive error when profile fetch fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "User not found" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchProfile()).rejects.toThrow("User not found");
  });

  it("updates profile data and returns the response", async () => {
    const payload = { firstName: "Jane", lastName: "Doe" };
    const mockResponse: UpdateProfileResponse = {
      user: {
        id: "1",
        email: "user@example.com",
        firstName: "Jane",
        lastName: "Doe",
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await updateProfile(payload);

    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  });

  it("throws when profile update fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Username is already taken" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(updateProfile({ username: "taken" })).rejects.toThrow("Username is already taken");
  });

  it("uploads an avatar image", async () => {
    const OriginalFormData = globalThis.FormData;
    class MockFormData {
      public entries: Array<[string, any]> = [];
      append(name: string, value: any, fileName?: string) {
        this.entries.push([name, { value, fileName }]);
      }
    }
    // @ts-expect-error test shim
    globalThis.FormData = MockFormData;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ profilePicture: "https://cdn/avatar.png" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const mockFile = {
      name: "avatar.png",
    } as File;

    const result = await uploadAvatar(mockFile, mockFile.name);

    expect(result.profilePicture).toBe("https://cdn/avatar.png");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile/avatar",
      expect.objectContaining({ method: "POST" }),
    );

    const body = fetchMock.mock.calls[0][1]?.body as MockFormData;
    expect(body).toBeInstanceOf(MockFormData);
    expect(body.entries[0][0]).toBe("avatar");

    if (OriginalFormData) {
      globalThis.FormData = OriginalFormData;
    } else {
      // @ts-expect-error cleanup
      delete globalThis.FormData;
    }
  });

  it("removes an avatar image", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Avatar removed" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(removeAvatar()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile/avatar",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
