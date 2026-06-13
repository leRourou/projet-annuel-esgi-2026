import { auth } from "@/lib/auth";
import { GenerateArticleInputSchema } from "@/modules/content/application/dto/generate-article.dto";
import { buildContainer } from "@/shared/infrastructure/di/container";
import type { z } from "zod";

const StreamInputSchema = GenerateArticleInputSchema.omit({
  authorId: true,
  agencyId: true,
});

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = StreamInputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const container = await buildContainer();
  if (!container.aiGenerator.generateStream) {
    return new Response("Streaming not supported", { status: 501 });
  }

  const encoder = new TextEncoder();
  const inputWithType: z.infer<typeof StreamInputSchema> = parsed.data;
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of container.aiGenerator.generateStream!(inputWithType)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
