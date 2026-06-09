// Minimal ambient declaration for the parts of `mammoth` we use (the package
// ships no TypeScript types).
declare module 'mammoth' {
  interface ConvertResult {
    value: string
    messages: unknown[]
  }
  interface MammothImage {
    contentType: string
    read(encoding: string): Promise<string>
  }
  interface MammothInput {
    buffer?: Buffer
    path?: string
  }
  interface MammothOptions {
    convertImage?: unknown
    styleMap?: string | string[]
  }
  const mammoth: {
    convertToHtml(input: MammothInput, options?: MammothOptions): Promise<ConvertResult>
    extractRawText(input: MammothInput): Promise<ConvertResult>
    images: {
      imgElement(
        func: (image: MammothImage) => Promise<{ src: string }>
      ): unknown
    }
  }
  export default mammoth
}
