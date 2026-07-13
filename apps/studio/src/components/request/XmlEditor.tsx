"use client";

import * as React from "react";

import { TextEditor } from "./TextEditor";

/**
 * XML editor — reuses the raw text editor with the `xml` language
 * hint. Syntax highlighting comes via the editor's content-type token
 * selection, which is wired in a later enhancement; today this is a
 * smart textarea with the XML column header.
 */
export function XmlEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
}): React.ReactElement {
  return (
    <TextEditor
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      language="xml"
    />
  );
}
