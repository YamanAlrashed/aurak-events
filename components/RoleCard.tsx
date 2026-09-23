import { MockUser } from "@/types/auth";

interface RoleCardProps {
  user: MockUser;
}

export default function RoleCard({ user }: RoleCardProps) {
  return (
    <button className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-900">
          {user.initials}
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            {user.label}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {user.name}
          </p>
        </div>
      </div>
    </button>
  );
}