import assert from "assert";
import { test } from "node:test";
import { computeWordCount } from "@/utils/wordCount";

const cases: Array<{ name: string; html: string | undefined; expected: number }> = [
  { name: "empty string", html: "", expected: 0 },
  { name: "undefined", html: undefined, expected: 0 },
  { name: "whitespace only", html: "   \n\t", expected: 0 },
  {
    name: "strips html tags",
    html: "<p>Hello <strong>world</strong></p>",
    expected: 2,
  },
  { name: "collapses multiple spaces", html: "one   two    three", expected: 3 },
  { name: "handles line breaks", html: "one\n\ntwo", expected: 2 },
  {
    name: "ignores empty html wrapper",
    html: "<div>   <br/>  </div>",
    expected: 0,
  },
];

for (const { name, html, expected } of cases) {
  test(name, () => {
    assert.strictEqual(computeWordCount(html), expected);
  });
}
