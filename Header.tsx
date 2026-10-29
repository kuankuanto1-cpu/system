/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, UserCheck, Plus, Building2 } from 'lucide-react';
import { User, UserRole } from '../types';
import { DEFAULT_USERS } from '../services/storage';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  breadcrumbs: string;
  onNewPPBClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  currentUser,
  setCurrentUser,
  breadcrumbs,
  onNewPPBClick,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
      {/* Left Zone: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-hidden"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium">
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline text-slate-900 font-semibold truncate">Grand Harmoni Residence</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 truncate">{breadcrumbs}</span>
        </div>
      </div>

      {/* Right Zone: Interactive Role Switcher & Action */}
      <div className="flex items-center gap-3">
        {/* Role Switcher for live testing of governance */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
          <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="hidden md:inline text-slate-500 text-[11px] font-medium">Peran Aktif:</span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const selected = DEFAULT_USERS.find((u) => u.id === e.target.value);
              if (selected) setCurrentUser(selected);
            }}
            className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-hidden cursor-pointer"
          >
            {DEFAULT_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onNewPPBClick}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap font-semibold">PPB Baru</span>
        </button>
      </div>
    </header>
  );
};
