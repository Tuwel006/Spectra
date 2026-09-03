"use client";

import * as React from "react";
import {
  Asterisk,
  KeyRound,
  Link2,
  Lock,
  Tag,
  User,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { Field, PreviewBlock, ScaffoldNotice } from "./AuthField";

/* ------------------------------------------------------------------ */
/* OAuth 2.0                                                           */
/* ------------------------------------------------------------------ */

export function OAuth2Form(): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <ScaffoldNotice feature="OAuth 2.0" />
      <div className="flex flex-col gap-3 opacity-90">
        <Field label="Authorization URL" icon={<Link2 className="h-3 w-3" />}>
          <Input
            size="sm"
            disabled
            placeholder="https://example.com/oauth/authorize"
            leadingIcon={<Link2 className="h-3.5 w-3.5" />}
          />
        </Field>
        <Field label="Token URL" icon={<KeyRound className="h-3 w-3" />}>
          <Input
            size="sm"
            disabled
            placeholder="https://example.com/oauth/token"
            leadingIcon={<KeyRound className="h-3.5 w-3.5" />}
          />
        </Field>
        <Field label="Client ID" icon={<User className="h-3 w-3" />}>
          <Input
            size="sm"
            disabled
            placeholder="client-id"
            leadingIcon={<User className="h-3.5 w-3.5" />}
          />
        </Field>
        <Field label="Client Secret" icon={<Lock className="h-3 w-3" />}>
          <Input
            size="sm"
            variant="password"
            disabled
            placeholder="••••••"
            leadingIcon={<Lock className="h-3.5 w-3.5" />}
          />
        </Field>
        <Field
          label="Scope"
          icon={<Asterisk className="h-3 w-3" />}
          hint="Space-separated scopes, e.g. read:users write:users."
        >
          <Input
            size="sm"
            disabled
            placeholder="read write"
            leadingIcon={<Asterisk className="h-3.5 w-3.5" />}
          />
        </Field>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* JWT                                                                 */
/* ------------------------------------------------------------------ */

export function JwtForm({
  token,
  onToken,
}: {
  token: string;
  onToken: (next: string) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <Field
        label="JWT token"
        icon={<Tag className="h-3 w-3" />}
        hint={
          <>
            Sends{" "}
            <code className="rounded bg-bg-muted px-1 font-mono text-[10px] text-text-secondary">
              Authorization: Bearer &lt;jwt&gt;
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
          leadingIcon={<Tag className="h-3.5 w-3.5" />}
          spellCheck={false}
          autoComplete="off"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <PreviewBlock
          title="Header"
          body={'{\n  "alg": "HS256",\n  "typ": "JWT"\n}'}
        />
        <PreviewBlock
          title="Payload"
          body={'{\n  "sub": "1234567890",\n  "name": "—",\n  "iat": 0\n}'}
        />
      </div>
    </div>
  );
}