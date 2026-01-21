import { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

type AppShellProps = {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function AppShell({ title, actions, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="nav">
        <div className="nav-title">{title ?? "Studio Gallery"}</div>
        <div className="nav-actions">
          {actions}
          <ThemeToggle />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
