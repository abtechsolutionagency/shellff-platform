import { describe, it, expect } from "vitest";
import {
  getPasswordChangeErrorMessage,
  getPasswordChangeSuccessMessage,
} from "../password-change";

describe("password change helpers", () => {
  it("returns the API-provided success message when available", () => {
    expect(
      getPasswordChangeSuccessMessage({ message: "Password updated successfully" }),
    ).toBe("Password updated successfully");
  });

  it("falls back to a default success message when the API omits one", () => {
    expect(getPasswordChangeSuccessMessage()).toBe("Password changed successfully");
  });

  it("extracts the error message from thrown errors", () => {
    expect(getPasswordChangeErrorMessage(new Error("Current password is incorrect"))).toBe(
      "Current password is incorrect",
    );
  });

  it("falls back to a generic error message for unknown throwables", () => {
    expect(getPasswordChangeErrorMessage(null)).toBe("Failed to change password");
  });
});
