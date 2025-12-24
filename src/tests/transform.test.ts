import { normalize } from "../schemas/record";

test("normalize minimal - fills source_id", () => {
  const out = normalize({ source: "csv", id: 123, title: "Hello" });
  expect(out.source).toBe("csv");
  expect(out.source_id).toBe("123");
  expect(out.title).toBe("Hello");
});
