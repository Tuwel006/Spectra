"use client";

import * as React from "react";

import { Select } from "@/components/ui/select";
import {
  BODY_TYPES,
  BODY_TYPE_LABEL,
  type BodyType,
} from "./request.types";

const BODY_TYPE_OPTIONS = BODY_TYPES.map((t) => ({
  value: t,
  label: BODY_TYPE_LABEL[t],
}));

/**
 * Body-type selector — a horizontally compact dropdown styled to sit at
 * the top of {@link RequestBody}. Maps the body-type id to its human
 * label and surfaces the currently configured content-type as a hint.
 */
export function BodyTypeSelector({
  value,
  onChange,
}: {
  value: BodyType;
  onChange: (next: BodyType) => void;
}): React.ReactElement {
  return (
    <Select
      size="sm"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value as BodyType)}
      aria-label="Body type"
      className="w-44"
      options={BODY_TYPE_OPTIONS}
    />
  );
}