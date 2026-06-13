"use client";

import { createTagAction, deleteTagAction } from "@/actions/tags.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Tag {
  id: string;
  name: string;
}

interface TagsClientProps {
  initialTags: Tag[];
  isAdmin: boolean;
}

export function TagsClient({ initialTags, isAdmin }: TagsClientProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await createTagAction({ name });
      if (result.error) {
        setError(result.error);
        return;
      }
      const newTag = result.data;
      if (newTag) setTags((prev) => [...prev, newTag]);
      setNewName("");
      router.refresh();
    });
  }

  function handleDelete(tagId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteTagAction(tagId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agency tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tags yet. Add some to classify your content.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-1">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {tag.name}
                  </Badge>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(tag.id)}
                      disabled={isPending}
                      className="text-muted-foreground hover:text-destructive transition-colors text-xs ml-1"
                      aria-label={`Remove tag ${tag.name}`}
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
                placeholder="New tag name…"
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
        <p className="text-xs text-muted-foreground">Only admins can add or remove tags.</p>
      )}
    </div>
  );
}
