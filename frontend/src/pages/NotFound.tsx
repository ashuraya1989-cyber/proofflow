import AppShell from "../components/AppShell";

export default function NotFound() {
  return (
    <AppShell title="Studio Gallery">
      <div className="page">
        <div className="empty">That page does not exist.</div>
      </div>
    </AppShell>
  );
}
