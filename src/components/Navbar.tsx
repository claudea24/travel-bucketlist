"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Explore" },
    { href: "/bucket-list", label: "My Bucket List" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold text-emerald-600">
          Travel Bucket List
        </Link>
        <div className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                pathname === link.href
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <UserButton />
    </nav>
  );
}
