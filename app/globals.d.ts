declare module "*.css";

// ─── Shopify App Bridge Web Components ────────────────────────────────────────
declare namespace JSX {
  interface IntrinsicElements {
    "s-app-nav": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    "s-link": React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLElement>, HTMLElement> & { href?: string };
    "s-page": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { heading?: string };
    "s-section": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { heading?: string; slot?: string };
    "s-paragraph": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    "s-text": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    "s-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { slot?: string; loading?: boolean; variant?: string; target?: string; onClick?: React.MouseEventHandler };
    "s-stack": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { direction?: string; gap?: string };
    "s-box": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { padding?: string; borderWidth?: string; borderRadius?: string; background?: string };
    "s-heading": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    "s-unordered-list": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    "s-list-item": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
