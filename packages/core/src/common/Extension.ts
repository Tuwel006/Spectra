export type ExtensionValue =
  | string
  | number
  | boolean
  | null
  | ExtensionValue[]
  | { [key: string]: ExtensionValue };

export type Extensions = Record<string, ExtensionValue>;