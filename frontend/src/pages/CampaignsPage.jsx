import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, PlusCircle, Heart, Clock, Sparkles, Flame, ArrowRight, HelpCircle, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CampaignsPage() {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [categories, setCategories] = useState([{ name: 'All', label: 'All Causes' }]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'funded' | 'target'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [displayLimit, setDisplayLimit] = useState(6);
    const [error, setError] = useState('');

    useEffect(() => {
        setDisplayLimit(6);
    }, [category, search, sortBy]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();
            if (res.ok && data.categories) {
                const dynamicCats = data.categories.map(c => ({ name: c.name, label: c.name }));
                setCategories([{ name: 'All', label: 'All Causes' }, ...dynamicCats]);
            }
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const fetchCampaigns = async () => {
            setLoading(true);
            setError('');
            try {
                const queryParams = new URLSearchParams();
                if (category !== 'All') queryParams.append('category', category);
                if (search.trim()) queryParams.append('search', search.trim());

                const res = await fetch(`/api/campaigns/public?${queryParams.toString()}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to fetch campaigns');
                if (isMounted) {
                    let fetchedCamps = data.campaigns || [];
                    
                    // Client-side sorting based on filter setting
                    if (sortBy === 'newest') {
                        fetchedCamps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    } else if (sortBy === 'funded') {
                        fetchedCamps.sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount));
                    } else if (sortBy === 'target') {
                        fetchedCamps.sort((a, b) => b.targetAmount - a.targetAmount);
                    }

                    setCampaigns(fetchedCamps);
                }
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchCampaigns();

        return () => {
            isMounted = false;
        };
    }, [category, search, sortBy]);

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900">
            {/* Header Section with Search Bar */}
            <div className="bg-gradient-to-b from-emerald-50/80 via-white to-[#FAFAFA] pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto">
                        <div className="relative flex items-center shadow-md rounded-full bg-white border border-slate-200 p-2 focus-within:ring-2 focus-within:ring-emerald-500 transition">
                            <div className="pl-4 text-slate-400">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title, keyword, or fundraiser name..."
                                className="w-full pl-3 pr-4 py-2 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-medium"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Grid Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Active Campaigns</h2>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs">
                            {campaigns.length} Causes Found
                        </span>
                    </div>

                    {/* Filter Settings (Dropdown Category Selector + Sort Order) right beside Title */}
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                        >
                            <option value="All">All Categories</option>
                            {categories.filter(cat => cat.name !== 'All').map(cat => (
                                <option key={cat.name} value={cat.name}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="funded">Most Funded (%)</option>
                            <option value="target">Highest Goal (৳)</option>
                        </select>

                        {/* View Mode Toggle (Grid vs List) */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-center space-x-2">
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="bg-white rounded-3xl border border-slate-200 p-4 animate-pulse h-96 flex flex-col justify-between">
                                <div className="bg-slate-200 aspect-video rounded-2xl w-full mb-4"></div>
                                <div className="space-y-3">
                                    <div className="bg-slate-200 h-4 rounded w-1/3"></div>
                                    <div className="bg-slate-200 h-6 rounded w-3/4"></div>
                                    <div className="bg-slate-200 h-4 rounded w-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 text-center py-20 px-4 shadow-sm">
                        <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No campaigns found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                            We couldn't find any approved campaigns matching your search or category filter.
                        </p>
                        <button
                            onClick={() => { setSearch(''); setCategory('All'); }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                            {campaigns.slice(0, displayLimit).map(camp => {
                                const progress = Math.min(100, Math.round((camp.currentAmount / camp.targetAmount) * 100));
                                
                                let daysRemaining = null;
                                if (camp.endDate) {
                                    const diffTime = new Date(camp.endDate) - new Date();
                                    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                                }

                                if (viewMode === 'list') {
                                    return (
                                        <Link 
                                            to={`/campaigns/${camp.id}`}
                                            key={camp.id}
                                            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col sm:flex-row items-center justify-between group hover:-translate-y-0.5 p-4 sm:p-6 gap-6"
                                        >
                                            <div className="relative aspect-video sm:w-72 sm:h-44 w-full rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                                                <img
                                                    src={`data:${camp.imageType};base64,${camp.imageData}`}
                                                    alt={camp.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                />
                                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-emerald-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                                    {camp.category}
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-3 w-full">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition leading-snug">
                                                        {camp.title}
                                                    </h3>
                                                    {daysRemaining !== null && (
                                                        <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 shrink-0">
                                                            <Clock className="w-3 h-3 text-emerald-600" />
                                                            <span>{daysRemaining}d left</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed font-normal">
                                                    {camp.description}
                                                </p>
                                                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                                                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                                                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white overflow-hidden flex items-center justify-center font-bold text-[10px]">
                                                            {camp.createdBy?.profilePhotoUrl ? (
                                                                <img src={camp.createdBy.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                camp.createdBy?.displayName?.charAt(0).toUpperCase() || 'U'
                                                            )}
                                                        </div>
                                                        <span>Organized by <strong className="text-slate-700">{camp.createdBy?.displayName || 'Anonymous'}</strong></span>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <div className="text-right">
                                                            <span className="text-base font-black text-emerald-700">৳{camp.currentAmount.toLocaleString()}</span>
                                                            <span className="text-xs text-slate-400 block">Goal: ৳{camp.targetAmount.toLocaleString()} ({progress}%)</span>
                                                        </div>
                                                        <span className="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition group-hover:bg-emerald-700 shadow-sm">
                                                            Donate
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                }

                                return (
                                    <Link 
                                        to={`/campaigns/${camp.id}`}
                                        key={camp.id}
                                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-1"
                                    >
                                        <div>
                                            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                                                <img
                                                    src={`data:${camp.imageType};base64,${camp.imageData}`}
                                                    alt={camp.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                />
                                                <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                                                    {camp.category}
                                                </div>

                                                {daysRemaining !== null && (
                                                    <div className="absolute top-2.5 right-2.5 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                                        <Clock className="w-3 h-3 text-emerald-400" />
                                                        <span>{daysRemaining}d left</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-5">
                                                <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-emerald-600 transition leading-snug">
                                                    {camp.title}
                                                </h3>
                                                <p className="text-slate-600 text-xs line-clamp-2 mb-3 leading-relaxed font-normal">
                                                    {camp.description}
                                                </p>

                                                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-3">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white overflow-hidden flex items-center justify-center font-bold text-[10px]">
                                                        {camp.createdBy?.profilePhotoUrl ? (
                                                            <img src={camp.createdBy.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            camp.createdBy?.displayName?.charAt(0).toUpperCase() || 'U'
                                                        )}
                                                    </div>
                                                    <span className="text-[11px]">Organized by <strong className="text-slate-700">{camp.createdBy?.displayName || 'Anonymous'}</strong></span>
                                                </div>

                                                <div className="space-y-1.5 mb-1">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-base font-black text-emerald-700">৳{camp.currentAmount.toLocaleString()}</span>
                                                        <span className="text-[11px] font-bold text-slate-400">{progress}% funded</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-right text-[11px] font-semibold text-slate-500">
                                                        Goal: ৳{camp.targetAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-5 pb-5 pt-0">
                                            <span
                                                className="w-full bg-slate-50 hover:bg-emerald-600 text-slate-800 hover:text-white font-bold py-2.5 rounded-xl transition duration-200 flex items-center justify-center space-x-1.5 border border-slate-200 group-hover:border-transparent group-hover:shadow-md group-hover:shadow-emerald-600/20 text-xs"
                                            >
                                                <Heart className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white transition" />
                                                <span>Donate Now</span>
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {displayLimit < campaigns.length && (
                            <div className="text-center pt-8">
                                <button
                                    onClick={() => setDisplayLimit(prev => prev + 6)}
                                    className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-8 py-4 rounded-2xl border border-slate-200 shadow-sm transition duration-200 cursor-pointer text-sm"
                                >
                                    Load More Campaigns ({campaigns.length - displayLimit} remaining) 
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
