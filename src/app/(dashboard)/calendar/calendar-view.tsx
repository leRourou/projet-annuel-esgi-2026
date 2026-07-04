"use client";

import { rescheduleArticleAction } from "@/actions/content.actions";
import { Button } from "@/components/ui/button";
import type { ArticleDto } from "@/modules/content/application/dto/article.dto";
import type { ContentTypeValue } from "@/modules/content/domain/value-objects/content-type.vo";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CONTENT_TYPE_COLORS: Record<ContentTypeValue, string> = {
  ARTICLE: "bg-blue-100 text-blue-800 border-blue-200",
  PRODUCT_SHEET: "bg-purple-100 text-purple-800 border-purple-200",
  META: "bg-slate-100 text-slate-800 border-slate-200",
  LINKEDIN_POST: "bg-sky-100 text-sky-800 border-sky-200",
  FACEBOOK_POST: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: "bg-gray-400",
  REVIEW: "bg-amber-400",
  VALIDATED: "bg-blue-400",
  SCHEDULED: "bg-purple-400",
  PUBLISHED: "bg-green-500",
};

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMonthMatrix(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7; // week starts Monday
  const start = new Date(year, month, 1 - leadingDays);

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

interface CalendarViewProps {
  initialArticles: ArticleDto[];
}

export function CalendarView({ initialArticles }: CalendarViewProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();

  const weeks = useMemo(() => buildMonthMatrix(year, month), [year, month]);

  const articlesByDay = useMemo(() => {
    const map = new Map<string, ArticleDto[]>();
    for (const article of articles) {
      if (!article.scheduledAt) continue;
      const key = dateKey(new Date(article.scheduledAt));
      const existing = map.get(key) ?? [];
      existing.push(article);
      map.set(key, existing);
    }
    return map;
  }, [articles]);

  function goToMonth(delta: number) {
    setCursorDate(new Date(year, month + delta, 1));
  }

  function handleDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    setDragOverKey(null);
    const articleId = e.dataTransfer.getData("text/plain");
    if (!articleId) return;
    setError(null);
    startTransition(async () => {
      const result = await rescheduleArticleAction(articleId, day);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        const updated = result.data;
        setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">
          {cursorDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => goToMonth(-1)} disabled={isPending}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursorDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => goToMonth(1)} disabled={isPending}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        {(Object.keys(CONTENT_TYPE_COLORS) as ContentTypeValue[]).map((type) => (
          <span key={type} className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-sm border ${CONTENT_TYPE_COLORS[type]}`}
            />
            {type.replace("_", " ").toLowerCase()}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground text-center"
          >
            {label}
          </div>
        ))}

        {weeks.flatMap((week) =>
          week.map((day) => {
            const key = dateKey(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = key === dateKey(new Date());
            const dayArticles = articlesByDay.get(key) ?? [];

            return (
              <div
                key={key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverKey(key);
                }}
                onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                onDrop={(e) => handleDrop(e, day)}
                className={[
                  "min-h-24 bg-background p-1.5 space-y-1",
                  !isCurrentMonth ? "opacity-40" : "",
                  dragOverKey === key ? "bg-accent" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-xs inline-flex items-center justify-center w-5 h-5 rounded-full",
                    isToday ? "bg-foreground text-background font-medium" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {day.getDate()}
                </span>
                <div className="space-y-1">
                  {dayArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/content/${article.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", article.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] cursor-grab active:cursor-grabbing hover:opacity-80 ${CONTENT_TYPE_COLORS[article.contentType]}`}
                      title={article.title}
                    >
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[article.status] ?? "bg-gray-400"}`}
                      />
                      <span className="truncate">{article.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          }),
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
        <span className="font-medium">Status:</span>
        {Object.entries(STATUS_DOT).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
            {status.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
