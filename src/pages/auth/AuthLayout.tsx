import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";

/** Shared composition for public entry routes; no authentication state lives here. */
export function AuthLayout({ title, description, children }: {
  title: string; description?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-pl-bg-subtle text-pl-ink font-sans">
      <header className="border-b border-pl-border bg-pl-bg px-6 py-3 md:py-4">
        <div className="flex items-center gap-4">
          <img src="/assets/photon-legal.png" alt="Photon Legal" className="h-6 w-auto md:h-8" />
          <span className="border-l border-pl-border pl-4 text-sm font-semibold text-pl-navy">Pulse</span>
        </div>
      </header>
      <main data-auth-workspace className="mx-auto w-full max-w-md px-6 py-6 md:py-12">
        <h1 className="font-display text-2xl font-semibold md:text-3xl text-pl-navy">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-pl-text-2">{description}</p>}
        <div className="mt-4 md:mt-6">{children}</div>
      </main>
    </div>
  );
}

export function AuthMessage({ children }: { children?: ReactNode }) {
  const message = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (children) message.current?.scrollIntoView({ block: "nearest" }); }, [children]);
  return children ? <p ref={message} role="alert" className="mb-4 border-l-2 border-pl-red pl-3 text-sm leading-relaxed text-pl-red-text">{children}</p> : null;
}

export function AuthBackLink() {
  return <Link to="/login" className="mt-6 inline-flex text-sm font-medium text-pl-blue-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pl-blue">Back to sign in</Link>;
}
