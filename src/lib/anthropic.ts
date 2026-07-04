import Anthropic from "@anthropic-ai/sdk";

let instance: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!instance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    instance = new Anthropic({ apiKey });
  }
  return instance;
}
