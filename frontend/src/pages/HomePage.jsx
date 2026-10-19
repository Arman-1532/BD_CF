import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, PlusCircle, Heart, Clock, Sparkles, Flame, ArrowRight, HelpCircle, ShieldCheck, Handshake, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
    const { user } = useAuth();
    const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const sliderRef = React.useRef(null);

    const scrollSlider = (direction) => {
        if (sliderRef.current) {
            const { scrollLeft, clientWidth } = sliderRef.current;
            const scrollAmount = clientWidth * 0.75;
            sliderRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const fetchFeaturedCampaigns = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch('/api/campaigns/public');
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to fetch campaigns');
                if (isMounted) {
                    // Show all approved campaigns on the home page slider
                    setFeaturedCampaigns(data.campaigns || []);
                }
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchFeaturedCampaigns();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-emerald-50/80 via-white to-[#FAFAFA] pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-tight">
                        Fund Causes That Matter, Change Lives Today
                    </h1>
                    <p className="text-slate-600 text-lg sm:text-xl font-normal max-w-2xl mx-auto mt-4 mb-8">
                        Empowering transparent charitable giving and community-driven causes across Bangladesh with verified tracking.
                    </p>

                    {/* Start a Fundraiser CTA Button in place of search bar & categories */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/create-campaign"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base tracking-wide uppercase px-8 py-4 rounded-full shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:scale-105 flex items-center space-x-3"
                        >
                            <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                            <span>Start a Fundraiser</span>
                        </Link>
                        <Link
                            to="/campaigns"
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-base px-8 py-4 rounded-full transition flex items-center space-x-2"
                        >
                            <span>Explore All Campaigns</span>
                            <ArrowRight className="w-4 h-4 text-slate-500" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Featured Campaigns Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Featured Fundraisers</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Handpicked urgent causes needing immediate support.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            to="/campaigns"
                            className="hidden sm:flex text-sm font-bold text-emerald-600 hover:text-emerald-700 items-center space-x-1 group"
                        >
                            <span>View All Campaigns</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-center space-x-2">
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(n => (
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
                ) : featuredCampaigns.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 text-center py-20 px-4 shadow-sm">
                        <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No active campaigns yet</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                            Be the first to start a fundraiser and make a difference!
                        </p>
                        <Link
                            to="/create-campaign"
                            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Start a Fundraiser</span>
                        </Link>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Absolute Left Scroll Button */}
                        <button
                            onClick={() => scrollSlider('left')}
                            className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-lg transition cursor-pointer hidden sm:flex"
                            title="Scroll Left"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        {/* Absolute Right Scroll Button */}
                        <button
                            onClick={() => scrollSlider('right')}
                            className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-lg transition cursor-pointer hidden sm:flex"
                            title="Scroll Right"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        <div ref={sliderRef} className="flex overflow-x-hidden pb-6 pt-2 space-x-6 scroll-smooth snap-x snap-mandatory px-2">
                            {featuredCampaigns.map(camp => {
                                const progress = Math.min(100, Math.round((camp.currentAmount / camp.targetAmount) * 100));
                                
                                let daysRemaining = null;
                                if (camp.endDate) {
                                    const diffTime = new Date(camp.endDate) - new Date();
                                    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                                }

                                return (
                                    <Link 
                                        to={`/campaigns/${camp.id}`}
                                        key={camp.id}
                                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-1 min-w-[280px] sm:min-w-[320px] max-w-[350px] shrink-0 snap-start"
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
                    </div>
                )}
            </div>
        </div>
    );
}
