"use client";

import * as React from "react";
import {
  FileKey2,
  KeyRound,
  Link2,
  Lock,
  Tag,
  User,
  Webhook,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { Field, SegmentedToggle } from "./AuthField";

/* ------------------------------------------------------------------ */
/* No Auth                                                             */
/* ------------------------------------------------------------------ */

export function NoAuth(): React.ReactElement {
  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed border-border/70 bg-bg-subtle/40 p-3">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-bg-muted text-text-muted">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5">
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

/* ------------------------------------------------------------------ */
/* Bearer                                                              */
/* ------------------------------------------------------------------ */

export function BearerForm({
  token,
  onToken,
}: {
  token: string;
  onToken: (next: string) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Bearer token"
        icon={<Tag className="h-3 w-3" />}
        hint={
          <>
            Sends{" "}
            <code className="rounded bg-bg-muted px-1 font-mono text-[10px] text-text-secondary">
              Authorization: Bearer &lt;token&gt;
            </code>
            .
          </>
        }
      >
        <Input
          size="sm"
          variant="password"
          value={token}
          onChange={(e) => onToken(e.currentTarget.value)}
          placeholder="eyJhbGciOi..."
          leadingIcon={<KeyRound className="h-3.5 w-3.5" />}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Basic                                                               */
/* ------------------------------------------------------------------ */

export function BasicForm({
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
    <div className="flex flex-col gap-3">
      <Field label="Username" icon={<User className="h-3 w-3" />}>
        <Input
          size="sm"
          value={username}
          onChange={(e) => onUsername(e.currentTarget.value)}
          placeholder="user"
          leadingIcon={<User className="h-3.5 w-3.5" />}
          spellCheck={false}
          autoComplete="username"
        />
      </Field>
      <Field
        label="Password"
        icon={<Lock className="h-3 w-3" />}
        hint="Encoded as base64 and sent as the Authorization header."
      >
        <Input
          size="sm"
          variant="password"
          value={password}
          onChange={(e) => onPassword(e.currentTarget.value)}
          placeholder="password"
          leadingIcon={<Lock className="h-3.5 w-3.5" />}
          spellCheck={false}
          autoComplete="current-password"
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* API Key                                                             */
/* ------------------------------------------------------------------ */

export function ApiKeyForm({
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
    <div className="flex flex-col gap-3">
      <Field label="Key name" icon={<Tag className="h-3 w-3" />}>
        <Input
          size="sm"
          value={name}
          onChange={(e) => onName(e.currentTarget.value)}
          placeholder="X-API-Key"
          leadingIcon={<Tag className="h-3.5 w-3.5" />}
          spellCheck={false}
        />
      </Field>
      <Field
        label="Value"
        icon={<KeyRound className="h-3 w-3" />}
        hint="The secret key value. Hidden by default — click the eye to reveal."
      >
        <Input
          size="sm"
          variant="password"
          value={value}
          onChange={(e) => onValue(e.currentTarget.value)}
          placeholder="••••••"
          leadingIcon={<FileKey2 className="h-3.5 w-3.5" />}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>
      <Field label="Add to" icon={<Link2 className="h-3 w-3" />}>
        <SegmentedToggle
          ariaLabel="Add API key to"
          value={inWhere}
          onChange={onIn}
          options={[
            { value: "header", label: "Header", icon: <Webhook className="h-3 w-3" /> },
            { value: "query", label: "Query Params", icon: <Link2 className="h-3 w-3" /> },
          ]}
        />
      </Field>
    </div>
  );
}