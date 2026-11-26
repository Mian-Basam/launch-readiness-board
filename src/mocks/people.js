export const PEOPLE = [
  { id: "u1", name: "Avery Chen", role: "Product" },
  { id: "u2", name: "Jordan Park", role: "QA" },
  { id: "u3", name: "Sam Rivera", role: "Security" },
  { id: "u4", name: "Taylor Brooks", role: "Engineering" },
];

/** The signed-in user for this demo. */
export const ME_ID = "u4";

export function personById(id) {
  return PEOPLE.find((p) => p.id === id) ?? null;
}
