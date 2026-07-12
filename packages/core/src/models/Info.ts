import type { BaseNode } from "../common/BaseNode.js";

export interface Contact {
  readonly name?: string;
  readonly url?: string;
  readonly email?: string;
}

export interface License {
  readonly name: string;
  readonly url?: string;
  readonly identifier?: string;
}

export interface Info extends BaseNode {
  readonly title: string;
  readonly version: string;
  readonly summary?: string;
  readonly termsOfService?: string;
  readonly contact?: Contact;
  readonly license?: License;
}
