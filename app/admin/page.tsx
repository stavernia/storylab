import Link from "next/link";

export default async function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Admin tools for managing users and application settings.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">User Management</h2>
          <p className="mt-1 text-sm text-slate-600">View users, update roles, and disable accounts.</p>
          <Link
            href="/admin/users"
            className="mt-3 inline-flex items-center text-sm font-semibold text-cyan-700 hover:text-cyan-600"
          >
            Go to Users
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Feedback</h2>
          <p className="mt-1 text-sm text-slate-600">Review submissions, adjust status, and follow up with users.</p>
          <Link
            href="/admin/feedback"
            className="mt-3 inline-flex items-center text-sm font-semibold text-cyan-700 hover:text-cyan-600"
          >
            View Feedback
          </Link>
        </div>
      </div>
    </div>
  );
}
