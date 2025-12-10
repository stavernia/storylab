export default function DisabledPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-lg space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">Account disabled</h1>
        <p className="text-slate-600">
          Your account has been disabled. If you think this is a mistake, please contact support so we can help
          restore access.
        </p>
        <p className="text-sm text-slate-500">You can safely close this window.</p>
      </div>
    </div>
  );
}
