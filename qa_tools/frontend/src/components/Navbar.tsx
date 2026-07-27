"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearAuth } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/projects", label: "Projects" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </div>
              <span className="text-white font-semibold text-sm">AI QA Platform</span>
            </Link>

            {/* Nav links */}
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
