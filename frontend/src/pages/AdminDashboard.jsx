import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Users, Clock, CheckCircle2, XCircle, AlertCircle, Check, X, Calendar, Ban, Flag, History, MapPin, DollarSign, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const { accessToken } = useAuth();
    const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'users' | 'reports' | 'categories' | 'logs'
    const [stats, setStats] = useState({ totalUsers: 0, pendingCampaigns: 0, liveCampaigns: 0 });
    const [campaigns, setCampaigns] = useState([]);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state for Takedown
    const [takedownModalOpen, setTakedownModalOpen] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [takedownReason, setTakedownReason] = useState('');

    // Modal state for Campaign Detail Review
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    // Modal state for Blacklist
    const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [blacklistReason, setBlacklistReason] = useState('');
    const [takedownCampaigns, setTakedownCampaigns] = useState(true);

    useEffect(() => {
        fetchAllAdminData();
    }, []);

    const fetchAllAdminData = async () => {
        setLoading(true);
        setError('');
        try {
            const [dashRes, usersRes, logsRes, campsRes, catsRes, reportsRes] = await Promise.all([
                fetch('/api/campaigns/admin/dashboard', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch('/api/admin/audit-logs', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch('/api/admin/campaigns', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch('/api/admin/categories', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
                fetch('/api/admin/reports', { headers: { 'Authorization': `Bearer ${accessToken}` } }).catch(() => ({ ok: true, json: () => ({ reports: [] }) }))
            ]);

            const dashData = await dashRes.json();
            const usersData = await usersRes.json();
            const logsData = await logsRes.json();
            const campsData = await campsRes.json();
            const catsData = await catsRes.json();
            const reportsData = await reportsRes.json();

            if (!dashRes.ok || !usersRes.ok || !logsRes.ok || !campsRes.ok || !catsRes.ok || !reportsRes.ok) {
                throw new Error('Failed to load full admin data');
            }

            setStats(dashData.stats);
            setCampaigns(campsData.campaigns);
            setUsers(usersData.users);
            setLogs(logsData.logs);
            setCategories(catsData.categories || []);
            setReports(reportsData.reports || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const res = await fetch(`/api/campaigns/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update status');
            fetchAllAdminData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleTakedownSubmit = async (e) => {
        e.preventDefault();
        if (!takedownReason.trim()) return;

        try {
            const res = await fetch(`/api/admin/campaigns/${selectedCampaignId}/takedown`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ reason: takedownReason })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to take down campaign');

            setTakedownModalOpen(false);
            setSelectedCampaignId(null);
            setTakedownReason('');
            fetchAllAdminData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleBlacklistSubmit = async (e) => {
        e.preventDefault();
        if (!blacklistReason.trim()) return;

        try {
            const res = await fetch(`/api/admin/users/${selectedUserId}/blacklist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ reason: blacklistReason, takedownCampaigns })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to blacklist user');

            setBlacklistModalOpen(false);
            setSelectedUserId(null);
            setBlacklistReason('');
            setTakedownCampaigns(true);
            fetchAllAdminData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            const res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ name: newCategoryName.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create category');

            setNewCategoryName('');
            fetchAllAdminData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;

        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete category');

            fetchAllAdminData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleReportStatusUpdate = async (reportId, status) => {
        try {
            const res = await fetch(`/api/admin/reports/${reportId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update report status');
            fetchAllAdminData();
        } catch (err) {
            alert(err.message);
        }
    };

    const pendingCampaignsList = campaigns.filter(c => c.status === 'PENDING');

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 pb-20">
            {/* Compact Professional Header & Stats Bar */}
            <div className="bg-gradient-to-b from-emerald-50/80 via-white to-[#FAFAFA] py-6 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center space-x-2.5">
                            <ShieldCheck className="w-7 h-7 text-emerald-600" />
                            <span>Admin Control Center</span>
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Moderate fundraisers, manage user blacklist privileges, and review reports.</p>
                    </div>

                    {/* Mini Stats Badges */}
                    <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                        <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3 shrink-0">
                            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                <Users className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</p>
                                <p className="text-base font-black text-slate-900">{users.length}</p>
                            </div>
                        </div>

                        <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3 shrink-0">
                            <div className="bg-amber-50 p-2 rounded-xl text-amber-500">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Review</p>
                                <p className="text-base font-black text-amber-500">{pendingCampaignsList.length}</p>
                            </div>
                        </div>

                        <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3 shrink-0">
                            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Campaigns</p>
                                <p className="text-base font-black text-emerald-600">{campaigns.filter(c => c.status === 'APPROVED').length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

                {/* Tabs Navigation */}
                <div className="flex space-x-2 border-b border-slate-200 mb-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('campaigns')}
                        className={`pb-4 px-6 font-bold text-sm transition border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'campaigns' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                    >
                        Fundraiser Moderation ({campaigns.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-4 px-6 font-bold text-sm transition border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'users' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                    >
                        User Accounts & Blacklist ({users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`pb-4 px-6 font-bold text-sm transition border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'reports' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                    >
                        Reports ({reports.filter(r => r.status === 'PENDING').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-4 px-6 font-bold text-sm transition border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'categories' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                    >
                        Categories ({categories.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`pb-4 px-6 font-bold text-sm transition border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'logs' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                    >
                        Audit Logs ({logs.length})
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* TAB 1: CAMPAIGNS */}
                {activeTab === 'campaigns' && (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">All Platform Fundraisers</h3>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-400">Loading campaigns...</div>
                        ) : campaigns.length === 0 ? (
                            <div className="text-center py-20 px-4 text-slate-500">No campaigns found.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {campaigns.map(camp => {
                                    const statusColor = 
                                        camp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        camp.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                        camp.status === 'TAKEN_DOWN' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                        'bg-amber-50 text-amber-700 border-amber-200';

                                    return (
                                        <div key={camp.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-slate-50/50 transition">
                                            <div className="flex items-start space-x-4 flex-1 min-w-0">
                                                <img
                                                    src={`data:${camp.imageType};base64,${camp.imageData}`}
                                                    alt={camp.title}
                                                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-xs"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusColor}`}>
                                                            {camp.status}
                                                        </span>
                                                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                                            {camp.category}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-900 mb-1 truncate">{camp.title}</h4>
                                                    <p className="text-slate-600 text-sm line-clamp-2 mb-2 max-w-2xl">{camp.description}</p>
                                                    <div className="text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-4">
                                                        <span>Goal: <strong className="text-emerald-700">৳{camp.targetAmount.toLocaleString()}</strong></span>
                                                        <span>Raised: <strong className="text-emerald-700">৳{camp.currentAmount.toLocaleString()}</strong></span>
                                                        <span className="flex items-center space-x-1.5">
                                                            <span>By:</span>
                                                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white overflow-hidden inline-flex items-center justify-center text-[10px] font-bold">
                                                                {camp.createdBy?.profilePhotoUrl ? (
                                                                    <img src={camp.createdBy.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    camp.createdBy?.displayName?.charAt(0).toUpperCase() || 'U'
                                                                )}
                                                            </span>
                                                            <strong className="text-slate-800">{camp.createdBy?.displayName || 'Unknown'}</strong>
                                                            {camp.createdBy?.isVerified && <span className="text-[10px] text-emerald-600 font-bold">✓</span>}
                                                        </span>
                                                    </div>
                                                    {camp.takedownReason && (
                                                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-xl border border-red-100">
                                                            <strong>Takedown Reason:</strong> {camp.takedownReason}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 w-full lg:w-auto justify-end flex-wrap gap-2">
                                                {camp.status === 'PENDING' ? (
                                                    <button
                                                        onClick={() => setSelectedCampaign(camp)}
                                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-emerald-200 cursor-pointer"
                                                    >
                                                        View Details
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedCampaign(camp)}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                                                    >
                                                        View Details
                                                    </button>
                                                )}
                                                {camp.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(camp.id, 'APPROVED')}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(camp.id, 'REJECTED')}
                                                            className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-red-200 cursor-pointer"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {camp.status !== 'TAKEN_DOWN' && camp.status !== 'PENDING' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCampaignId(camp.id);
                                                            setTakedownModalOpen(true);
                                                        }}
                                                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer"
                                                    >
                                                        <Flag className="w-3.5 h-3.5" />
                                                        <span>Take Down</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: USERS */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">User Management & Blacklist</h3>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-400">Loading users...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                            <th className="py-4 px-6">User</th>
                                            <th className="py-4 px-6">Role</th>
                                            <th className="py-4 px-6">Campaigns</th>
                                            <th className="py-4 px-6">Account Status</th>
                                            <th className="py-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {users.map(u => (
                                            <tr key={u.userId} className="hover:bg-slate-50/50 transition">
                                                <td className="py-4 px-6 flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-bold overflow-hidden flex items-center justify-center shrink-0">
                                                        {u.profilePhotoUrl ? (
                                                            <img src={u.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            u.displayName.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                                            <span>{u.displayName}</span>
                                                            {u.isVerified && (
                                                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                                                    Verified ✓
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-400">{u.email}</div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="bg-slate-100 text-slate-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-700">
                                                    {u._count?.campaigns || 0}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {u.isBlacklisted ? (
                                                        <span className="inline-flex items-center space-x-1 bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                                                            <Ban className="w-3.5 h-3.5" />
                                                            <span>Blacklisted</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Active</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {u.isBlacklisted ? (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Are you sure you want to reinstate this user account?')) return;
                                                                try {
                                                                    const res = await fetch(`/api/admin/users/${u.userId}/unblacklist`, {
                                                                        method: 'POST',
                                                                        headers: { 'Authorization': `Bearer ${accessToken}` }
                                                                    });
                                                                    const data = await res.json();
                                                                    if (!res.ok) throw new Error(data.error || 'Failed to reinstate user');
                                                                    fetchAllAdminData();
                                                                } catch (err) {
                                                                    alert(err.message);
                                                                }
                                                            }}
                                                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-emerald-200 cursor-pointer"
                                                        >
                                                            Unblacklist
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUserId(u.userId);
                                                                setBlacklistModalOpen(true);
                                                            }}
                                                            className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-red-200 flex items-center space-x-1 ml-auto cursor-pointer"
                                                        >
                                                            <Ban className="w-3.5 h-3.5" />
                                                            <span>Blacklist User</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: REPORTS */}
                {activeTab === 'reports' && (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Campaign Reports</h3>
                            <span className="text-xs text-slate-400">Total Reports: {reports.length}</span>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-400">Loading reports...</div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-20 px-4 text-slate-500">No campaign reports submitted yet.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {reports.map(rep => {
                                    const statusBadge = 
                                        rep.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        rep.status === 'DISMISSED' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                        'bg-amber-50 text-amber-700 border-amber-200';

                                    return (
                                        <div key={rep.id} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-slate-50/50 transition">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusBadge}`}>
                                                        {rep.status}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        Reported on {new Date(rep.createdAt).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h4 className="text-base font-bold text-slate-900">
                                                        Campaign: <Link to={`/campaigns/${rep.campaign?.id}`} className="text-emerald-600 hover:underline">{rep.campaign?.title || 'Unknown Campaign'}</Link>
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Organizer: <strong className="text-slate-700">{rep.campaign?.createdBy?.displayName || 'Unknown'}</strong> ({rep.campaign?.createdBy?.email})
                                                    </p>
                                                </div>

                                                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-2xl border border-red-100 max-w-2xl">
                                                    <strong>Report Reason:</strong> {rep.reason}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 w-full lg:w-auto justify-end flex-wrap gap-2">
                                                {rep.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleReportStatusUpdate(rep.id, 'RESOLVED')}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
                                                        >
                                                            Resolve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReportStatusUpdate(rep.id, 'DISMISSED')}
                                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </>
                                                )}
                                                {rep.campaign && rep.campaign.status !== 'TAKEN_DOWN' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCampaignId(rep.campaign.id);
                                                            setTakedownModalOpen(true);
                                                        }}
                                                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer"
                                                    >
                                                        <Flag className="w-3.5 h-3.5" />
                                                        <span>Take Down Campaign</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: CATEGORIES */}
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Category</h3>
                            <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="text"
                                    required
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Disaster Relief, Animal Welfare..."
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition"
                                />
                                <button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-md shadow-emerald-600/20 cursor-pointer"
                                >
                                    Add Category
                                </button>
                            </form>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900">Existing Categories</h3>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center text-slate-400">Loading categories...</div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-20 px-4 text-slate-500">No categories found.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition">
                                            <div className="flex items-center space-x-3">
                                                <span className="bg-emerald-50 text-emerald-700 font-bold px-4 py-1.5 rounded-full text-xs border border-emerald-200">
                                                    {cat.name}
                                                </span>
                                                <span className="text-xs text-slate-400">Created: {new Date(cat.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-red-200 cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 5: AUDIT LOGS */}
                {activeTab === 'logs' && (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Administrative Audit Logs</h3>
                            <span className="text-xs text-slate-400">Showing last 100 actions</span>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-400">Loading audit logs...</div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-20 px-4 text-slate-500">No audit logs recorded yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                            <th className="py-4 px-6">Timestamp</th>
                                            <th className="py-4 px-6">Admin</th>
                                            <th className="py-4 px-6">Action Type</th>
                                            <th className="py-4 px-6">Reason / Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {logs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition">
                                                <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 font-bold text-slate-900">
                                                    {log.admin?.displayName || 'Admin'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="bg-indigo-50 text-indigo-700 text-xs font-extrabold px-2.5 py-1 rounded-full uppercase">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 text-xs">
                                                    {log.reason}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CAMPAIGN DETAIL MODAL */}
            {selectedCampaign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
                        <div className="p-6 sm:p-8 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                                        {selectedCampaign.category}
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                                        {selectedCampaign.status}
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{selectedCampaign.title}</h3>
                                {selectedCampaign.tagline && <p className="text-sm text-slate-500 mt-1">{selectedCampaign.tagline}</p>}
                            </div>
                            <button
                                onClick={() => setSelectedCampaign(null)}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 space-y-8 flex-1">
                            {/* Step 1: Location Information */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                    <span>Step 1: Cause Location</span>
                                </h4>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase">Location / Address</p>
                                        <p className="font-bold text-slate-900 mt-0.5">{selectedCampaign.location || 'Dhaka, Bangladesh'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase">Created On</p>
                                        <p className="font-bold text-slate-800 mt-0.5">{new Date(selectedCampaign.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase">Campaign Deadline</p>
                                        <p className="font-bold text-slate-800 mt-0.5">
                                            {selectedCampaign.endDate ? new Date(selectedCampaign.endDate).toLocaleDateString() : 'No Deadline'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold uppercase">Target vs Raised</p>
                                        <p className="font-bold text-emerald-700 mt-0.5">৳{selectedCampaign.currentAmount?.toLocaleString() || 0} / ৳{selectedCampaign.targetAmount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Category & Goal */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    <span>Step 2: Category & Financial Goals</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Target Goal</p>
                                        <p className="text-xl font-black text-emerald-900 mt-1">৳{selectedCampaign.targetAmount?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Amount Raised</p>
                                        <p className="text-xl font-black text-blue-900 mt-1">৳{selectedCampaign.currentAmount?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
                                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Category</p>
                                        <p className="text-lg font-black text-indigo-900 mt-1 uppercase">{selectedCampaign.category}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Story & Media */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-emerald-600" />
                                    <span>Step 3: Story & Media Proof</span>
                                </h4>
                                <div className="space-y-4">
                                    <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm max-h-72">
                                        <img
                                            src={`data:${selectedCampaign.imageType};base64,${selectedCampaign.imageData}`}
                                            alt={selectedCampaign.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedCampaign.description}
                                    </div>

                                    {/* Verification Document Proof */}
                                    {selectedCampaign.verificationDoc ? (
                                        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="w-6 h-6 text-emerald-700" />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Official Verification Document Attached</p>
                                                    <p className="text-[11px] text-emerald-800">Ready for review (NID / Passport / Hospital Letter)</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`data:${selectedCampaign.verificationDocType || 'application/pdf'};base64,${selectedCampaign.verificationDoc}`}
                                                download={`VerificationDoc_${selectedCampaign.id}.${selectedCampaign.verificationDocType?.includes('image') ? 'png' : 'pdf'}`}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs"
                                            >
                                                Download / View Document
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-400 font-medium">
                                            No separate verification document attached for this campaign.
                                        </div>
                                    )}

                                    {selectedCampaign.videoLink && (
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Attached Video / Proof Link</p>
                                            <a
                                                href={selectedCampaign.videoLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold text-emerald-600 hover:underline truncate block"
                                            >
                                                {selectedCampaign.videoLink} ↗
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 4: Organizer & Payout Info */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    <span>Step 4: Organizer & Creator Profile</span>
                                </h4>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg overflow-hidden shrink-0">
                                            {selectedCampaign.createdBy?.profilePhotoUrl ? (
                                                <img src={selectedCampaign.createdBy.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                selectedCampaign.createdBy?.displayName?.charAt(0).toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Campaign Organizer</p>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-base font-bold text-slate-900">{selectedCampaign.createdBy?.displayName || 'Unknown'}</p>
                                                {selectedCampaign.createdBy?.isVerified && (
                                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">Verified ✓</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">{selectedCampaign.createdBy?.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">User ID / Ref</p>
                                        <p className="text-xs font-mono font-bold text-slate-600">{selectedCampaign.createdById}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3 sticky bottom-0">
                            {selectedCampaign.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedCampaign.id, 'APPROVED');
                                            setSelectedCampaign(null);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer"
                                    >
                                        Approve Campaign
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedCampaign.id, 'REJECTED');
                                            setSelectedCampaign(null);
                                        }}
                                        className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-6 py-3 rounded-2xl text-xs transition border border-red-200 cursor-pointer"
                                    >
                                        Reject Campaign
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setSelectedCampaign(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-6 py-3 rounded-2xl text-xs transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAKEDOWN MODAL */}
            {takedownModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200">
                        <h3 className="text-xl font-black text-slate-900 mb-2">Take Down Campaign</h3>
                        <p className="text-slate-500 text-xs mb-6">This will immediately remove the campaign from public feeds.</p>
                        
                        <form onSubmit={handleTakedownSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Reason for Takedown *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={takedownReason}
                                    onChange={(e) => setTakedownReason(e.target.value)}
                                    placeholder="Provide a clear reason (e.g. Terms of Service violation)..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 transition resize-none"
                                />
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setTakedownModalOpen(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition shadow-md cursor-pointer"
                                >
                                    Confirm Takedown
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* BLACKLIST MODAL */}
            {blacklistModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200">
                        <h3 className="text-xl font-black text-slate-900 mb-2 text-red-600">Blacklist User Account</h3>
                        <p className="text-slate-500 text-xs mb-6">This will immediately terminate active sessions and suspend user privileges.</p>
                        
                        <form onSubmit={handleBlacklistSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Blacklist Reason *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={blacklistReason}
                                    onChange={(e) => setBlacklistReason(e.target.value)}
                                    placeholder="Reason for suspension..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-red-500 transition resize-none"
                                />
                            </div>

                            <div className="flex items-center space-x-3 py-1">
                                <input
                                    type="checkbox"
                                    id="takedownCamps"
                                    checked={takedownCampaigns}
                                    onChange={(e) => setTakedownCampaigns(e.target.checked)}
                                    className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                                />
                                <label htmlFor="takedownCamps" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Automatically take down all live campaigns owned by this user
                                </label>
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setBlacklistModalOpen(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-red-600/20 cursor-pointer"
                                >
                                    Confirm Blacklist
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
