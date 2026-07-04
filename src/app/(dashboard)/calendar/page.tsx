import { listScheduledArticlesAction } from "@/actions/content.actions";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const result = await listScheduledArticlesAction();
  const articles = result.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag content between days to reschedule its publication date.
        </p>
      </div>
      <CalendarView initialArticles={articles} />
    </div>
  );
}
