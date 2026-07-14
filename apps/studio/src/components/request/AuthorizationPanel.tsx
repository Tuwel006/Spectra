"use client";

import * as React from "react";
import { KeySquare, Lock, ShieldCheck, User } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import type { AuthType } from "./request.types";
import { useRequestDraftStore } from "./request.store";
import { cn } from "@/lib/cn";

/**
 * Authorization configuration panel.
 *
 * <p>
 *   Selects one of six authentication flavours from a tab strip. Each
 *   flavour renders its own sub-form. No runtime logic — the layout is
 *   UI-only per the spec.
 * </p>
 */
export function AuthorizationPanel({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const auth = useRequestDraftStore(
    (s) => s.drafts[endpointId]?.authorization ?? { type: "no-auth", apiKeyIn: "header" },
  );
  const patch = useRequestDraftStore((s) => s.patchDraft);

  const setType = (next: AuthType) =>
    patch(endpointId, "authorization", { ...auth, type: next });

  const set = (partial: Partial<typeof auth>) =>
    patch(endpointId, "authorization", { ...auth, ...partial });

  return (
    <div className="flex flex-col gap-4 p-4">
      <Tabs
        items={[
          { id: "no-auth", label: "No Auth" },
          { id: "bearer", label: "Bearer" },
          { id: "basic", label: "Basic" },
          { id: "apiKey", label: "API Key" },
          { id: "oauth2", label: "OAuth 2.0" },
          { id: "jwt", label: "JWT" },
        ]}
        value={auth.type}
        onChange={(v) => setType(v as AuthType)}
        variant="pills"
      />

      <div className="rounded-md border border-border bg-bg-base p-4">
        {auth.type === "no-auth" ? <NoAuth /> : null}
        {auth.type === "bearer" ? (
          <BearerForm
            token={auth.token ?? ""}
            onToken={(token) => set({ token })}
          />
        ) : null}
        {auth.type === "basic" ? (
          <BasicForm
            username={auth.username ?? ""}
            password={auth.password ?? ""}
            onUsername={(username) => set({ username })}
            onPassword={(password) => set({ password })}
          />
        ) : null}
        {auth.type === "apiKey" ? (
          <ApiKeyForm
            name={auth.apiKeyName ?? ""}
            value={auth.apiKeyValue ?? ""}
            inWhere={auth.apiKeyIn}
            onName={(apiKeyName) => set({ apiKeyName })}
            onValue={(apiKeyValue) => set({ apiKeyValue })}
            onIn={(apiKeyIn) => set({ apiKeyIn })}
          />
        ) : null}
        {auth.type === "oauth2" ? <OAuth2Placeholder /> : null}
        {auth.type === "jwt" ? <JWTPlaceholder /> : null}
      </div>

      <p className="px-1 text-[11px] italic text-text-muted">
        Authorization values stay inside the workspace. No network calls
        are issued from this panel.
      </p>
    </div>
  );
}

function NoAuth(): React.ReactElement {
  return (
    <div className="flex items-start gap-3">
      <Lock className="mt-0.5 h-4 w-4 text-text-muted" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-text-primary">
          No authentication required
        </p>
        <p className="text-[11px] text-text-muted">
          The endpoint will be called without any Authorization header.
        </p>
      </div>
    </div>
  );
}

function BearerForm({
  token,
  onToken,
}: {
  token: string;
  onToken: (next: string) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <Label icon={<KeySquare className="h-3 w-3" />}>Bearer token</Label>
      <Input
        size="sm"
        value={token}
        onChange={(e) => onToken(e.currentTarget.value)}
        placeholder="eyJhbGciOi..."
        type="password"
      />
      <p className="text-[11px] text-text-muted">
        Sends <code className="font-mono">Authorization: Bearer {"<token>"}</code>.
      </p>
    </div>
  );
}

function BasicForm({
  username,
  password,
  onUsername,
  onPassword,
}: {
  username: string;
  password: string;
  onUsername: (next: string) => void;
  onPassword: (next: string) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <Label icon={<User className="h-3 w-3" />}>Username</Label>
      <Input
        size="sm"
        value={username}
        onChange={(e) => onUsername(e.currentTarget.value)}
        placeholder="user"
      />
      <Label icon={<Lock className="h-3 w-3" />}>Password</Label>
      <Input
        size="sm"
        value={password}
        onChange={(e) => onPassword(e.currentTarget.value)}
        placeholder="password"
        type="password"
      />
    </div>
  );
}

function ApiKeyForm({
  name,
  value,
  inWhere,
  onName,
  onValue,
  onIn,
}: {
  name: string;
  value: string;
  inWhere: "header" | "query";
  onName: (next: string) => void;
  onValue: (next: string) => void;
  onIn: (next: "header" | "query") => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <Label icon={<KeySquare className="h-3 w-3" />}>Key name</Label>
      <Input
        size="sm"
        value={name}
        onChange={(e) => onName(e.currentTarget.value)}
        placeholder="X-API-Key"
      />
      <Label>Value</Label>
      <Input
        size="sm"
        value={value}
        onChange={(e) => onValue(e.currentTarget.value)}
        placeholder="••••••"
        type="password"
      />
      <Label>Add to</Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onIn("header")}
          className={cn(
            "rounded-md border px-3 py-1 text-xs",
            inWhere === "header"
              ? "border-accent bg-accent-subtle text-accent"
              : "border-border bg-bg-base text-text-secondary",
          )}
        >
          Header
        </button>
        <button
          type="button"
          onClick={() => onIn("query")}
          className={cn(
            "rounded-md border px-3 py-1 text-xs",
            inWhere === "query"
              ? "border-accent bg-accent-subtle text-accent"
              : "border-border bg-bg-base text-text-secondary",
          )}
        >
          Query Params
        </button>
      </div>
    </div>
  );
}

function OAuth2Placeholder(): React.ReactElement {
  return (
    <div className="flex items-start gap-3">
      <ShieldCheck className="mt-0.5 h-4 w-4 text-text-muted" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-text-primary">OAuth 2.0</p>
        <p className="text-[11px] text-text-muted">
          Configurable in a later phase — UI scaffolding only.
        </p>
      </div>
    </div>
  );
}

function JWTPlaceholder(): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <Label icon={<KeySquare className="h-3 w-3" />}>JWT token</Label>
      <Input
        size="sm"
        placeholder="eyJhbGciOi..."
        disabled
      />
      <p className="text-[11px] text-text-muted">
        Decoded header / payload viewers arrive once API testing ships.
      </p>
    </div>
  );
}

function Label({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      {icon}
      {children}
    </span>
  );
}
