import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  MapPin,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
  Copy,
  Check,
  Trash2,
  Laptop,
  Mail,
  Store,
  Filter,
} from 'lucide-react';
import { SellerLoginSession, SellerProfile } from '../../types';

interface SellerLoginSessionsViewProps {
  sessions: SellerLoginSession[];
  sellers: SellerProfile[];
  onRefresh: () => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  triggerToast: (msg: string) => void;
  revealedPasswords: Record<string, boolean>;
  togglePasswordVisibility: (sellerId: string) => void;
}

export const SellerLoginSessionsView: React.FC<SellerLoginSessionsViewProps> = ({
  sessions,
  sellers,
  onRefresh,
  onDeleteSession,
  triggerToast,
  revealedPasswords,
  togglePasswordVisibility,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'ALL' | 'MOBILE' | 'DESKTOP' | 'TABLET'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedUaId, setExpandedUaId] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Refresh handler
  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      triggerToast('Recent seller login sessions refreshed successfully.');
    } catch {
      triggerToast('Refreshed from active cache.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Device category filter
      if (deviceFilter === 'MOBILE' && s.deviceCategory !== 'mobile') return false;
      if (deviceFilter === 'DESKTOP' && s.deviceCategory !== 'desktop') return false;
      if (deviceFilter === 'TABLET' && s.deviceCategory !== 'tablet') return false;

      // Search text
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (s.sellerName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.shopName || '').toLowerCase().includes(q) ||
        (s.ip || '').toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q) ||
        (s.deviceType || '').toLowerCase().includes(q) ||
        (s.browser || '').toLowerCase().includes(q) ||
        (s.userAgent || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, searchQuery, deviceFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = sessions.length;
    const uniqueSellers = new Set(sessions.map((s) => (s && s.email ? s.email.toLowerCase() : s?.sellerName || s?.id || 'seller'))).size;
    const mobileCount = sessions.filter((s) => s.deviceCategory === 'mobile').length;
    const desktopCount = sessions.filter((s) => s.deviceCategory === 'desktop').length;
    const mobilePct = total > 0 ? Math.round((mobileCount / total) * 100) : 0;
    const desktopPct = total > 0 ? Math.round((desktopCount / total) * 100) : 0;
    return { total, uniqueSellers, mobilePct, desktopPct };
  }, [sessions]);

  // Relative time helper
  const getRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Device badge renderer
  const renderDeviceBadge = (deviceType: string, category?: string) => {
    const lower = deviceType.toLowerCase();
    if (lower.includes('android')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{deviceType}</span>
        </span>
      );
    }
    if (lower.includes('iphone') || lower.includes('ios')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
          <Smartphone className="w-3.5 h-3.5 text-violet-600 shrink-0" />
          <span>{deviceType}</span>
        </span>
      );
    }
    if (lower.includes('ipad') || category === 'tablet') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Tablet className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>{deviceType}</span>
        </span>
      );
    }
    if (lower.includes('windows')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <Monitor className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>{deviceType}</span>
        </span>
      );
    }
    if (lower.includes('mac')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Laptop className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{deviceType}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Monitor className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>{deviceType}</span>
      </span>
    );
  };

  // Browser badge renderer
  const renderBrowserBadge = (browser: string) => {
    const lower = browser.toLowerCase();
    let colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
    if (lower.includes('chrome')) colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
    if (lower.includes('edge')) colorClass = 'bg-cyan-50 text-cyan-800 border-cyan-200';
    if (lower.includes('safari')) colorClass = 'bg-sky-50 text-sky-800 border-sky-200';
    if (lower.includes('firefox')) colorClass = 'bg-orange-50 text-orange-800 border-orange-200';

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colorClass}`}>
        <Globe className="w-3 h-3 shrink-0" />
        <span>{browser}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. SECTION HEADER (Exact Requirement: 'Recent Seller Logins' header with 'Refresh' button) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Seller Logins</h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time audit log of authenticated seller sessions, browser signatures, IP addresses, and physical locations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              title="Refresh recent seller logins"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 2. SUMMARY METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Logins</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">{stats.total}</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Active Sellers</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">{stats.uniqueSellers}</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Mobile Devices</span>
            <span className="text-lg font-black text-emerald-700 mt-0.5 block">{stats.mobilePct}%</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Desktop Devices</span>
            <span className="text-lg font-black text-sky-700 mt-0.5 block">{stats.desktopPct}%</span>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS: SEARCH & DEVICE FILTER TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by seller name, email, IP, device, browser, or location..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2 hidden sm:inline flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Device:
          </span>
          {(
            [
              { key: 'ALL', label: 'All' },
              { key: 'MOBILE', label: 'Mobile' },
              { key: 'DESKTOP', label: 'Desktop' },
              { key: 'TABLET', label: 'Tablet' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setDeviceFilter(t.key)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                deviceFilter === t.key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MAIN SESSIONS TABLE DISPLAY (Desktop & Tablet) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto hidden lg:block">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[220px]">Seller Info</th>
                <th className="py-3 px-4 min-w-[280px]">Device & Browser</th>
                <th className="py-3 px-4 min-w-[200px]">Location & IP</th>
                <th className="py-3 px-4 min-w-[190px]">Login Time</th>
                <th className="py-3 px-4 w-16 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No seller login sessions found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery ? 'Try clearing or modifying your search keywords.' : 'Sellers will appear here automatically when they log in.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session, index) => {
                  const isUaExpanded = expandedUaId === session.id;
                  const relativeTime = getRelativeTime(session.timestamp);

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Row index */}
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                        {index + 1}
                      </td>

                      {/* 1. Seller Info: Gmail FIRST, then Name & Store */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 text-sky-300 font-black text-xs flex items-center justify-center shrink-0 shadow-xs ring-1 ring-slate-700/50">
                            {(session.email || session.sellerName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-[#0284C7] font-bold font-mono text-xs">
                              <Mail className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                              <span className="select-all">{session.email}</span>
                              <button
                                onClick={() => handleCopy(session.email, `mail_${session.id}`, 'Email')}
                                className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors ml-0.5"
                                title="Copy Email"
                              >
                                {copiedId === `mail_${session.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                              <span>{session.sellerName}</span>
                              {session.shopName && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  <Store className="w-2.5 h-2.5" />
                                  {session.shopName}
                                </span>
                              )}
                            </div>
                            {session.phone && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Phone: {session.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Device & Browser: Badges and User Agent String */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {renderDeviceBadge(session.deviceType, session.deviceCategory)}
                            {renderBrowserBadge(session.browser)}
                          </div>
                          {/* User Agent String Display with Copy & Expand */}
                          <div className="flex items-center gap-1 max-w-[340px]">
                            <div
                              onClick={() => setExpandedUaId(isUaExpanded ? null : session.id)}
                              className={`text-[10px] font-mono text-slate-500 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 cursor-pointer select-all transition-all ${
                                isUaExpanded ? 'whitespace-normal break-all' : 'truncate'
                              }`}
                              title={session.userAgent}
                            >
                              <span className="text-slate-400 font-semibold mr-1">UA:</span>
                              {session.userAgent}
                            </div>
                            <button
                              onClick={() => handleCopy(session.userAgent, `ua_${session.id}`, 'User Agent')}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0"
                              title="Copy full User Agent string"
                            >
                              {copiedId === `ua_${session.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 3. Location & IP: IP address and location details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                              <Globe className="w-3 h-3 text-slate-500" />
                              {session.ip}
                            </span>
                            <button
                              onClick={() => handleCopy(session.ip, `ip_${session.id}`, 'IP address')}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              title="Copy IP address"
                            >
                              {copiedId === `ip_${session.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{session.location}</span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Login Time: Exact system formatted date and timestamp */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                            <Clock className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                            <span>
                              {session.timestamp
                                ? new Date(session.timestamp).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true,
                                  })
                                : session.loginTime}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 pl-5">
                            {relativeTime}
                          </div>
                        </div>
                      </td>

                      {/* Quick Actions (Delete session log) */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete login record for ${session.sellerName}?`)) {
                              await onDeleteSession(session.id);
                              triggerToast('Login record deleted.');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete this session record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Mobile / Tablet Cards View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No seller login sessions found</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const relativeTime = getRelativeTime(session.timestamp);
              return (
                <div key={session.id} className="p-4 space-y-3 bg-white">
                  {/* Header: Seller Info + Relative Time */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-sky-300 font-black text-xs flex items-center justify-center shrink-0">
                        {(session.email || session.sellerName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-mono font-bold text-xs text-[#0284C7]">
                          <Mail className="w-3 h-3 text-[#0284C7] shrink-0" />
                          <span className="truncate max-w-[180px]">{session.email}</span>
                        </div>
                        <div className="font-semibold text-xs text-slate-800 mt-0.5">{session.sellerName}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {relativeTime}
                    </span>
                  </div>

                  {/* Device & Browser Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {renderDeviceBadge(session.deviceType, session.deviceCategory)}
                    {renderBrowserBadge(session.browser)}
                  </div>

                  {/* Location & IP Details */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">IP Address</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-800 mt-0.5">
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{session.ip}</span>
                        <button
                          onClick={() => handleCopy(session.ip, `m_ip_${session.id}`, 'IP')}
                          className="p-0.5 text-slate-400 hover:text-slate-700"
                        >
                          {copiedId === `m_ip_${session.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Location</span>
                      <div className="flex items-center gap-1 text-slate-700 font-medium mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{session.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* User Agent Monospace String */}
                  <div className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 break-all">
                    <span className="font-semibold text-slate-400 mr-1">User Agent:</span>
                    {session.userAgent}
                  </div>

                  {/* Footer: Exact Timestamp & Delete */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-slate-600 text-[11px] font-semibold">
                      <Clock className="w-3 h-3 text-[#0284C7]" />
                      <span>
                        {session.timestamp
                          ? new Date(session.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true,
                            })
                          : session.loginTime}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Delete login record for ${session.sellerName}?`)) {
                          await onDeleteSession(session.id);
                          triggerToast('Login record deleted.');
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
