declare module '../lib/turndown.es.js' {
  export interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: '*' | '+' | '-';
    codeBlockStyle?: 'indented' | 'fenced';
    fence?: '```' | '~~~';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '**' | '__';
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
    br?: string;
    preformattedCode?: boolean;
    blankReplacement?: (content: string, node: Node) => string;
    keepReplacement?: (content: string, node: Node) => string;
    defaultReplacement?: (content: string, node: Node) => string;
    rules?: Record<string, Rule>;
  }

  export interface Rule {
    filter: string | string[] | ((node: HTMLElement, options: TurndownOptions) => boolean);
    replacement: (content: string, node: HTMLElement, options: TurndownOptions) => string;
  }

  export default class TurndownService {
    constructor(options?: TurndownOptions);
    turndown(input: string | HTMLElement | Document | DocumentFragment): string;
    use(plugin: Plugin | Plugin[]): this;
    addRule(key: string, rule: Rule): this;
    keep(filter: string | string[] | ((node: HTMLElement, options: TurndownOptions) => boolean)): this;
    remove(filter: string | string[] | ((node: HTMLElement, options: TurndownOptions) => boolean)): this;
    escape(str: string): string;
  }

  export type Plugin = (turndownService: TurndownService) => void;
}