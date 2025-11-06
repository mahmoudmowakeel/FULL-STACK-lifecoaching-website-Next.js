declare module "bidi-js" {
  export interface BidiOptions {
    direction?: "rtl" | "ltr" | "auto";
  }

  export interface BidiResult {
    text: string;
  }

  export function bidi(text: string, options?: BidiOptions): BidiResult;
}
