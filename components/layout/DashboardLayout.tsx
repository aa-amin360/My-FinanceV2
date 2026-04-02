"use client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 p-5 hidden md:flex flex-col gap-6">
        <h1 className="text-green-400 text-xl font-bold">My Finance</h1>

        <nav className="flex flex-col gap-3 text-sm">
          <SidebarItem label="Dashboard" active />
          <SidebarItem label="Transactions" />
          <SidebarItem label="Categories" />
          <SidebarItem label="Savings" />
          <SidebarItem label="Debt" />
          <SidebarItem label="Reports" />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">{children}</main>

      {/* RIGHT PANEL */}
      <aside className="w-80 bg-slate-900 p-5 hidden lg:block">
        <h3 className="text-sm text-gray-400 mb-4">Insights</h3>

        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-xs text-gray-400">Coming soon</p>
          <p className="text-lg font-bold mt-2">Analytics Panel</p>
        </div>
      </aside>
    </div>
  );
}

function SidebarItem({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`px-3 py-2 rounded-lg cursor-pointer ${
        active
          ? "bg-green-500 text-black font-semibold"
          : "hover:bg-slate-800"
      }`}
    >
      {label}
    </div>
  );
}
