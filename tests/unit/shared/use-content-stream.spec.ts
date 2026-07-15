import { splitSseEvents } from "@/hooks/use-content-stream";
import { describe, expect, it } from "vitest";

describe("splitSseEvents", () => {
  it("splits a buffer containing complete events", () => {
    const { events, remainder } = splitSseEvents('data: {"text":"a"}\n\ndata: {"text":"b"}\n\n');
    expect(events).toEqual(['data: {"text":"a"}', 'data: {"text":"b"}']);
    expect(remainder).toBe("");
  });

  it("keeps a trailing partial event in the remainder instead of dropping it", () => {
    // Simulates a chunk boundary landing in the middle of an SSE event —
    // the event must not be parsed until the closing "\n\n" arrives.
    const { events, remainder } = splitSseEvents('data: {"text":"a"}\n\ndata: {"te');
    expect(events).toEqual(['data: {"text":"a"}']);
    expect(remainder).toBe('data: {"te');
  });

  it("reassembles an event split across two reader.read() chunks", () => {
    const first = splitSseEvents('data: {"te');
    expect(first.events).toEqual([]);
    expect(first.remainder).toBe('data: {"te');

    const second = splitSseEvents(`${first.remainder}xt":"ab"}\n\n`);
    expect(second.events).toEqual(['data: {"text":"ab"}']);
    expect(second.remainder).toBe("");
  });

  it("returns no events and an empty remainder for an empty buffer", () => {
    const { events, remainder } = splitSseEvents("");
    expect(events).toEqual([]);
    expect(remainder).toBe("");
  });
});
