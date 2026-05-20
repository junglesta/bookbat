import { cleanIsbn, isValidIsbn, isValidIsbn10, isValidIsbn13, toIsbn13 } from "./isbn";

describe("cleanIsbn", () => {
  it("removes spaces/hyphens and normalizes X", () => {
    expect(cleanIsbn("0-8044-2957-x")).toBe("080442957X");
  });
});

describe("isValidIsbn10", () => {
  it("validates good ISBN-10 values", () => {
    expect(isValidIsbn10("0141439513")).toBe(true);
    expect(isValidIsbn10("0-8044-2957-X")).toBe(true);
  });

  it("rejects invalid ISBN-10 values", () => {
    expect(isValidIsbn10("0141439514")).toBe(false);
    expect(isValidIsbn10("ABCDEFGHIJ")).toBe(false);
  });
});

describe("isValidIsbn13", () => {
  it("validates good ISBN-13 values", () => {
    expect(isValidIsbn13("9780141439518")).toBe(true);
  });

  it("rejects invalid ISBN-13 values", () => {
    expect(isValidIsbn13("9780141439519")).toBe(false);
  });
});

describe("isValidIsbn", () => {
  it("accepts valid 10 and 13", () => {
    expect(isValidIsbn("0141439513")).toBe(true);
    expect(isValidIsbn("9780141439518")).toBe(true);
  });

  it("rejects malformed/invalid values", () => {
    expect(isValidIsbn("123")).toBe(false);
    expect(isValidIsbn("9780141439519")).toBe(false);
  });
});

describe("toIsbn13", () => {
  it("keeps valid ISBN-13", () => {
    expect(toIsbn13("9780141439518")).toBe("9780141439518");
  });

  it("converts valid ISBN-10 to ISBN-13", () => {
    expect(toIsbn13("0141439513")).toBe("9780141439518");
    expect(toIsbn13("0-8044-2957-X")).toBe("9780804429573");
  });

  it("returns null for invalid ISBN", () => {
    expect(toIsbn13("0141439514")).toBeNull();
  });
});
