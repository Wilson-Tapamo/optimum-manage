// Fichier: src/components/AppShell.tsx

"use client"; // Indispensable pour utiliser useState

import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar"; // On importe la sidebar que nous avons créée
import { Menu } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-zinc-50/50">
      
      {/* --- SIDEBAR POUR DESKTOP (Statique et toujours visible) --- */}
      <aside className="hidden w-64 border-r border-zinc-200 bg-white lg:flex">
        <Sidebar />
      </aside>

      {/* --- GESTION DE LA SIDEBAR MOBILE (Superposition) --- */}
      {/* Fond semi-transparent */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden",
          isMobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      {/* Contenu de la sidebar qui glisse */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-full w-64 transform bg-white transition-transform duration-300 ease-in-out lg:hidden",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* --- CONTENU PRINCIPAL DE LA PAGE --- */}
      <div className="flex flex-1 flex-col">
        {/* Header visible uniquement sur mobile pour le bouton hamburger */}
        <header className="flex h-16 shrink-0 items-center border-b border-zinc-200 bg-white px-6 lg:hidden">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100"
            aria-label="Ouvrir le menu"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Votre contenu de page ira ici */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}