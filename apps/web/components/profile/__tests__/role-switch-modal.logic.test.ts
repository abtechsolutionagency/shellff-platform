import { describe, it, expect } from "vitest";
import {
  getRoleSwitchDestination,
  getRoleSwitchErrorMessage,
  getRoleSwitchSuccessMessage,
} from "../role-switch-modal";

describe("role switch helpers", () => {
  it("returns the API-provided success message", () => {
    expect(
      getRoleSwitchSuccessMessage({
        message: "Successfully switched to creator",
        user: undefined,
      }),
    ).toBe("Successfully switched to creator");
  });

  it("computes dashboard destinations for each role", () => {
    expect(getRoleSwitchDestination("CREATOR")).toBe("/creator/releases");
    expect(getRoleSwitchDestination("LISTENER")).toBe("/dashboard");
  });

  it("extracts error messages from thrown errors", () => {
    expect(getRoleSwitchErrorMessage(new Error("Role switch not allowed"))).toBe(
      "Role switch not allowed",
    );
  });

  it("falls back to a generic role-switch error message", () => {
    expect(getRoleSwitchErrorMessage(null)).toBe("Failed to switch role");
  });
});
