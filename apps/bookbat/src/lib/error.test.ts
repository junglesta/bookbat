import { getErrorMessage } from "./error";

describe("getErrorMessage", () => {
  it("returns Error message when available", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("returns string error when provided", () => {
    expect(getErrorMessage("oops", "fallback")).toBe("oops");
  });

  it("returns fallback for unknown values", () => {
    expect(getErrorMessage({ message: "not-an-error" }, "fallback")).toBe("fallback");
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
  });
});
