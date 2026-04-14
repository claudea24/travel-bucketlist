"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Discover" },
    { href: "/personal", label: "My Trips" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-teal-600 tracking-tight">
            Wanderlust
          </Link>
          <div className="hidden sm:flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium px-3.5 py-2 rounded-xl transition-all ${
                  isActive(link.href)
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <UserButton />
      </div>
      {/* Mobile nav */}
      <div className="flex sm:hidden gap-1 mt-2 -mx-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 text-center text-xs font-medium px-2 py-2 rounded-xl transition-all ${
              isActive(link.href)
                ? "bg-teal-50 text-teal-700"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
