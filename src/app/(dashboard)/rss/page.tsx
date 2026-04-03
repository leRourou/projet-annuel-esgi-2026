"use client";

import { useState, useTransition } from "react";
import { addFeedAction, refreshFeedsAction } from "@/actions/rss.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RssPage() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAddFeed(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await addFeedAction({ url, name });
      if (result.error) {
        setIsError(true);
        setMessage(result.error);
      } else {
        setIsError(false);
        setMessage(`Feed added successfully (id: ${result.data?.id})`);
        setUrl("");
        setName("");
      }
    });
  }

  function handleRefresh() {
    setMessage(null);
    startTransition(async () => {
      const result = await refreshFeedsAction();
      if (result.error) {
        setIsError(true);
        setMessage(result.error);
      } else {
        setIsError(false);
        setMessage(`Refreshed: ${result.data?.refreshed} feeds, ${result.data?.failed} failed`);
      }
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">RSS Feeds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Subscribe to content feeds for inspiration
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
          Refresh all
        </Button>
      </div>

      {message && (
        <Alert variant={isError ? "destructive" : "success"} className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a feed</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFeed} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Feed URL *</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://example.com/feed.xml"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="My favorite blog"
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              Add feed
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
