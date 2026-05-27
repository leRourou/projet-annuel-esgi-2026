"use client";

import { createThemeAction, deleteThemeAction } from "@/actions/theme.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Theme {
  id: string;
  name: string;
}

interface ThemesClientProps {
  initialThemes: Theme[];
  isAdmin: boolean;
}

export function ThemesClient({ initialThemes, isAdmin }: ThemesClientProps) {
  const [themes, setThemes] = useState<Theme[]>(initialThemes);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await createThemeAction({ name });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) setThemes((prev) => [...prev, result.data!]);
      setNewName("");
      router.refresh();
    });
  }

  function handleDelete(themeId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteThemeAction(themeId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setThemes((prev) => prev.filter((t) => t.id !== themeId));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agency themes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {themes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No themes yet. Add one to start generating ideas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => (
                <div key={theme.id} className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {theme.name}
                  </Badge>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(theme.id)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-destructive transition-colors text-xs ml-1"
                      aria-label={`Remove theme ${theme.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="flex gap-2 pt-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New theme name…"
                className="max-w-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                disabled={isPending}
              />
              <Button onClick={handleAdd} disabled={isPending || !newName.trim()} size="sm">
                Add
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {!isAdmin && (
        <p className="text-xs text-muted-foreground">Only admins can add or remove themes.</p>
      )}
    </div>
  );
}
