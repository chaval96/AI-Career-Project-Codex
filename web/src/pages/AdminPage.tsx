export function AdminPage() {
  return (
    <main className="mx-auto mt-10 max-w-3xl rounded-2xl border border-line bg-white p-6">
      <h1 className="m-0 text-2xl font-bold text-ink">Admin Diagnostics</h1>
      <p className="mt-2 text-sm text-slate-600">
        DEBUG_UI is enabled. This route is reserved for internal diagnostics and never shown in user flow.
      </p>
    </main>
  );
}
