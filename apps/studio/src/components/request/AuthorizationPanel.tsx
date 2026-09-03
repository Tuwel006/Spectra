"use client";

import * as React from "react";
import {
  FileKey2,
  KeyRound,
  Lock,
  ShieldCheck,
  Tag,
  User,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Tabs } from "@/components/ui/tabs";

import {
  ApiKeyForm,
  BasicForm,
  BearerForm,
  NoAuth,
} from "./AuthForms";
import { JwtForm, OAuth2Form } from "./AuthScaffoldForms";
import { SectionHeader } from "./AuthField";
import { SummaryPreview } from "./AuthSummary";
import { useRequestDraftStore } from "./request.store";
import type { AuthConfig, AuthType } from "./request.types";

const DEFAULT_AUTH: AuthConfig = { type: "no-auth", apiKeyIn: "header" };

type AuthTabMeta = {
  readonly id: AuthType;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly description: string;
};

const AUTH_TABS: readonly AuthTabMeta[] = [
  {
    id: "no-auth",
    label: "No Auth",
    icon: <Lock className="h-3.5 w-3.5" />,
    description: "Send the request without an Authorization header.",
  },
  {
    id: "bearer",
    label: "Bearer",
    icon: <KeyRound className="h-3.5 w-3.5" />,
    description: "Static bearer token sent in the Authorization header.",
  },
  {
    id: "basic",
    label: "Basic",
    icon: <User className="h-3.5 w-3.5" />,
    description: "Username and password encoded as base64.",
  },
  {
    id: "apiKey",
    label: "API Key",
    icon: <FileKey2 className="h-3.5 w-3.5" />,
    description: "Custom key/value pair added to a header or query string.",
  },
  {
    id: "oauth2",
    label: "OAuth 2.0",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    description: "OAuth 2.0 authorization scaffolding.",
  },
  {
    id: "jwt",
    label: "JWT",
    icon: <Tag className="h-3.5 w-3.5" />,
    description: "JSON Web Token sent in the Authorization header.",
  },
];

/**
 * Authorization configuration panel.
 *
 * <p>
 *   Selects one of six authentication flavours from a pill-style tab
 *   strip and renders the matching sub-form. No runtime logic — the
 *   layout is UI-only per the spec. Sub-components live in
 *   {@link ./AuthForms}, {@link ./AuthField}, and {@link ./AuthSummary}.
 * </p>
 */
export function AuthorizationPanel({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const auth = useRequestDraftStore(
    useShallow((s) => s.drafts[endpointId]?.authorization ?? DEFAULT_AUTH),
  );
  const patch = useRequestDraftStore((s) => s.patchDraft);

  const setType = (next: AuthType) =>
    patch(endpointId, "authorization", { ...auth, type: next });

  const set = (partial: Partial<typeof auth>) =>
    patch(endpointId, "authorization", { ...auth, ...partial });

  return (
    <div className="flex flex-col gap-4 p-4">
      <SectionHeader
        title="Authorization"
        description="Configure how this request is authenticated. Values live in the workspace — nothing leaves your browser."
      />

      <Tabs
        items={AUTH_TABS.map((t) => ({
          id: t.id,
          label: (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-text-muted">{t.icon}</span>
              {t.label}
            </span>
          ),
        }))}
        value={auth.type}
        onChange={(v) => setType(v as AuthType)}
        variant="pills"
      />

      <SummaryPreview auth={auth} />

      <div className="flex flex-col gap-3 rounded-md border border-border bg-bg-base p-4">
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
        {auth.type === "oauth2" ? <OAuth2Form /> : null}
        {auth.type === "jwt" ? (
          <JwtForm token={auth.token ?? ""} onToken={(token) => set({ token })} />
        ) : null}
      </div>

      <p className="inline-flex items-center gap-1.5 px-1 text-[11px] italic text-text-muted">
        <Lock className="h-3 w-3" aria-hidden="true" />
        Authorization values stay inside the workspace. No network calls
        are issued from this panel.
      </p>
    </div>
  );
}