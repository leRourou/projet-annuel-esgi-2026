"use client";

import { switchAgencyAction } from "@/actions/agency.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransition } from "react";

interface AgencySwitcherProps {
  currentAgencyId: string;
  agencies: { agencyId: string; agencyName: string }[];
}

export function AgencySwitcher({ currentAgencyId, agencies }: AgencySwitcherProps) {
  const [isPending, startTransition] = useTransition();

  if (agencies.length <= 1) return null;

  return (
    <Select
      value={currentAgencyId}
      disabled={isPending}
      onValueChange={(agencyId) => {
        startTransition(async () => {
          await switchAgencyAction(agencyId);
        });
      }}
    >
      <SelectTrigger className="w-full h-8 text-xs">
        <SelectValue placeholder="Select agency" />
      </SelectTrigger>
      <SelectContent>
        {agencies.map((a) => (
          <SelectItem key={a.agencyId} value={a.agencyId}>
            {a.agencyName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
