"use client";

import { inviteMemberAction } from "@/actions/agency.actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActionState } from "react";
import { useState } from "react";

type State = { error?: string; success?: string };

export function MembersClient({
  agencyId,
  actorRole,
}: {
  agencyId: string;
  actorRole: string;
}) {
  const [inviteRole, setInviteRole] = useState("MEMBER");

  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData): Promise<State> => {
      const email = formData.get("email") as string;
      const result = await inviteMemberAction({ targetEmail: email, role: inviteRole });
      if (result.error) return { error: result.error };
      return { success: `Invitation sent to ${email}` };
    },
    {},
  );

  if (actorRole !== "ADMIN") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invite a collaborator</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state.success && (
            <Alert>
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="colleague@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
