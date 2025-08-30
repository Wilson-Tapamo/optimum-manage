
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  DollarSign,
  LogOut,
  Hexagon,
  ClipboardCheck,
} from "lucide-react";

// Définition des liens de navigation pour une maintenance facile
const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projets", label: "Projets", icon: Briefcase },
  { href: "/taches", label: "Tâches", icon: ClipboardCheck },
  { href: "/consultants", label: "Consultants", icon: Users },
  { href: "/finance", label: "Finance", icon: DollarSign },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Logo et Nom de l'application */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Hexagon size={20} />
          </div>
          <span className="text-lg font-bold text-zinc-900">Optimum Manage</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        {/* Liens de navigation principaux */}
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-100 text-zinc-900" // Style actif
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" // Style par défaut et survol
                )}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Section utilisateur et déconnexion en bas */}
        <div className="mt-auto flex flex-col gap-2">
          <div className="my-2 h-px w-full bg-zinc-200"></div>
          <div className="flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 font-bold text-zinc-600">
              OD
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Olivier Dubois</p>
              <p className="text-xs text-zinc-500">olivier@optimum.fr</p>
            </div>
          </div>
          <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
            <LogOut size={18} />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}