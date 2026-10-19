import React, { useState, useEffect } from 'react';
import { PlusCircle, Upload, Calendar, HeartHandshake, Lock, Mail, User, Check, ArrowLeft, ArrowRight, ShieldCheck, MapPin, DollarSign, FileText, Phone } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';

// Bangladeshi Location Hierarchy Data for Cascading Dropdowns
const BD_LOCATIONS = {
    "Dhaka": {
        "Dhaka": ["Gulshan", "Banani", "Dhanmondi", "Mirpur", "Uttara", "Mohakhali", "Tejgaon", "Motijheel", "Lalbagh", "Tejgaon Industrial Area"],
        "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur", "Kaliganj"],
        "Narayanganj": ["Narayanganj Sadar", "Bandar", "Rupganj", "Sonargaon", "Araihazar"],
        "Tangail": ["Tangail Sadar", "Sakhipur", "Basail", "Madhupur", "Ghatail", "Kalihati", "Nagarpur", "Mirzapur", "Delduar", "Bhuapur", "Dhanbari"]
    },
    "Chittagong": {
        "Chittagong": ["Kotwali", "Pahartali", "Panchlaish", "Bayezid", "Bakalia", "Chandgaon", "Double Mooring", "Bandar", "Patenga"],
        "Cox's Bazar": ["Cox's Bazar Sadar", "Chakaria", "Kutubdia", "Ukhiya", "Moheshkhali", "Pekua", "Ramu", "Teknaf"],
        "Comilla": ["Comilla Sadar", "Comilla Sadar Dakshin", "Barura", "Brahmanpara", "Burichong", "Chandina", "Chauddagram", "Daudkandi", "Hajiganj", "Homna", "Laksam", "Monoharganj", "Meghna", "Titas", "Muradnagar", "Nangalkot"]
    },
    "Rajshahi": {
        "Rajshahi": ["Boalia", "Rajpara", "Motihar", "Shah Makhdum", "Paba", "Tanore", "Mohanpur", "Godagari", "Bagmara", "Durgapur", "Charghat", "Puthia"],
        "Bogra": ["Bogra Sadar", "Shajahanpur", "Shibganj", "Sonatala", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Sherpur", "Dhunat", "Adamdighi"],
        "Pabna": ["Pabna Sadar", "Ishwardi", "Atgharia", "Chatmohar", "Bera", "Santhia", "Sujanagar", "Faridpur", "Bhangura"]
    },
    "Khulna": {
        "Khulna": ["Sonadanga", "Khalishpur", "Daulatpur", "Khan Jahan Ali", "Kotwali", "Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra", "Paikgachha", "Phultala", "Rupsa"],
        "Jessore": ["Jessore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"]
    },
    "Barisal": {
        "Barisal": ["Barisal Sadar", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazipur"],
        "Bhola": ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"]
    },
    "Sylhet": {
        "Sylhet": ["Sylhet Sadar", "Beanibazar", "Bishwanath", "Companiganj", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Zakiganj", "South Surma"],
        "Moulvibazar": ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal"]
    },
    "Rangpur": {
        "Rangpur": ["Rangpur Sadar", "Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"],
        "Dinajpur": ["Dinajpur Sadar", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"]
    },
    "Mymensingh": {
        "Mymensingh": ["Mymensingh Sadar", "Bhaluka", "Trishal", "Haluaghat", "Muktagachha", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Ishwarganj", "Nandail", "Phulpur"],
        "Jamalpur": ["Jamalpur Sadar", "Baksiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari"]
    }
};

const PRESET_AMOUNTS = [25000, 50000, 100000, 250000, 500000, 1000000];

export default function CreateCampaignPage() {
    const { user, accessToken, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            toast.error('Administrators moderate campaigns and cannot create new fundraisers.');
            navigate('/admin');
        }
    }, [user]);

    // Wizard Step State (1 to 3)
    const [currentStep, setCurrentStep] = useState(1);

    // Dynamic Categories from Backend
    const [categories, setCategories] = useState(['Medical', 'Emergency Relief', 'Education', 'Religious', 'Community']);

    // Form Fields State (with localStorage auto-save draft)
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('bdcf_campaign_draft');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return {
            category: 'Medical',
            title: '',
            tagline: '',
            targetAmount: '',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            division: 'Dhaka',
            district: 'Dhaka',
            upazila: 'Gulshan',
            unionOrWard: '',
            postCode: '',
            description: '',
            termsAccepted: false
        };
    });

    // File Uploads
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [docFile, setDocFile] = useState(null);
    const [docPreview, setDocPreview] = useState(null);
    const [videoLinksList, setVideoLinksList] = useState(['']);

    const handleAddVideoRow = () => {
        setVideoLinksList(prev => [...prev, '']);
    };

    const handleRemoveVideoRow = (index) => {
        setVideoLinksList(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoRowChange = (index, value) => {
        setVideoLinksList(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authDisplayName, setAuthDisplayName] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Save draft to localStorage
    useEffect(() => {
        localStorage.setItem('bdcf_campaign_draft', JSON.stringify(formData));
    }, [formData]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();
            if (res.ok && data.categories && data.categories.length > 0) {
                setCategories(data.categories.map(c => c.name));
            }
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'division') {
                const firstDist = Object.keys(BD_LOCATIONS[value] || {})[0] || '';
                updated.district = firstDist;
                updated.upazila = (BD_LOCATIONS[value]?.[firstDist] || [])[0] || '';
            } else if (field === 'district') {
                updated.upazila = (BD_LOCATIONS[prev.division]?.[value] || [])[0] || '';
            }
            return updated;
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image file size must be less than 5MB.');
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleDocChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Document file size must be less than 5MB.');
            return;
        }
        setDocFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setDocPreview(reader.result);
        reader.readAsDataURL(file);
        toast.success(`Verification document "${file.name}" attached successfully.`);
    };

    const validateStep = (step) => {
        if (step === 1) {
            if (!formData.title.trim() || formData.title.length < 10) {
                toast.error('Fundraiser title must be at least 10 characters.');
                return false;
            }
            if (formData.title.length > 80) {
                toast.error('Fundraiser title must be under 80 characters.');
                return false;
            }
            if (!formData.targetAmount || parseFloat(formData.targetAmount) < 1000) {
                toast.error('Target amount must be at least ৳1,000.');
                return false;
            }
            if (!formData.endDate) {
                toast.error('Please specify a campaign end date.');
                return false;
            }
        }
        if (step === 2) {
            if (!formData.division || !formData.district || !formData.upazila) {
                toast.error('Please select division, district, and upazila.');
                return false;
            }
            if (!formData.description.trim() || formData.description.length < 100) {
                toast.error('Detailed story must be at least 100 characters.');
                return false;
            }
        }
        if (step === 3) {
            if (!imagePreview) {
                toast.error('Please upload a featured cover image.');
                return false;
            }
            if (!formData.termsAccepted) {
                toast.error('Please accept the Trust & Safety guidelines.');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(3, prev + 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(3)) return;

        if (!user) {
            setShowAuthModal(true);
            return;
        }

        executeSubmission(accessToken);
    };

    const executeSubmission = async (token) => {
        try {
            const base64String = imagePreview.split(',')[1];
            const imageType = imageFile?.type || 'image/jpeg';
            const docBase64 = docPreview ? docPreview.split(',')[1] : null;
            const docType = docFile?.type || (docFile ? 'application/pdf' : null);

            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: `${formData.tagline ? `Tagline: ${formData.tagline}\n\n` : ''}${formData.description}`,
                    category: formData.category,
                    targetAmount: parseFloat(formData.targetAmount),
                    endDate: formData.endDate,
                    imageData: base64String,
                    imageType,
                    verificationDoc: docBase64,
                    verificationDocType: docType,
                    videoLink: videoLinksList.filter(l => l && l.trim() !== '').join('\n'),
                    location: `${formData.upazila || ''}, ${formData.district || ''}, ${formData.division || ''}`.trim(),
                    unionOrWard: formData.unionOrWard,
                    postCode: formData.postCode
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to create campaign');

            localStorage.removeItem('bdcf_campaign_draft');
            toast.success('Fundraiser submitted for review successfully!');
            navigate(`/profile/${user ? user.userId : data.campaign.createdById}`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
        const payload = isLoginMode
            ? { email: authEmail, password: authPassword }
            : { displayName: authDisplayName || 'Organizer', email: authEmail, password: authPassword };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || data.error || 'Authentication failed');

            login(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
            toast.success(isLoginMode ? 'Signed in successfully!' : 'Account created successfully!');
            setShowAuthModal(false);
            executeSubmission(data.accessToken);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const stepsInfo = [
        { num: 1, title: 'Essentials & Goal' },
        { num: 2, title: 'Story & Location' },
        { num: 3, title: 'Visuals & Submit' }
    ];

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <BackButton label="Back" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {currentStep} of 3</span>
                </div>

                {/* Stepper Header Progress Bar */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <div className="grid grid-cols-3 gap-4">
                        {stepsInfo.map((s) => {
                            const isPassed = currentStep > s.num;
                            const isCurrent = currentStep === s.num;
                            return (
                                <div key={s.num} className="flex items-center space-x-3">
                                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                                        isPassed ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' :
                                        isCurrent ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-600' :
                                        'bg-slate-100 text-slate-400'
                                    }`}>
                                        {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Step {s.num}</div>
                                        <div className={`text-xs font-extrabold ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>{s.title}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Guest Mode Banner */}
                {!user && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm shadow-xs">
                        <div className="flex items-center space-x-2.5">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>You are filling this in guest mode. You can sign in when submitting your fundraiser.</span>
                        </div>
                        <Link to="/login" state={{ from: location }} className="font-bold underline text-emerald-700 shrink-0 hover:text-emerald-800">
                            Sign In Now
                        </Link>
                    </div>
                )}

                {/* Wizard Card Form */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
                    
                    {/* STEP 1: Essentials & Financial Goal */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Campaign Essentials & Financial Goal</h2>
                                <p className="text-sm text-slate-500">Define what your fundraiser is about and set a clear target goal and deadline.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Campaign Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleChange('category', e.target.value)}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Campaign Deadline / End Date *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => handleChange('endDate', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Fundraiser Title *</label>
                                    <span className={`text-xs font-semibold ${formData.title.length > 80 ? 'text-red-600' : 'text-slate-400'}`}>
                                        {formData.title.length}/80 chars
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={80}
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="e.g. Emergency Medical Treatment Support for Local Community Member"
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Short Summary / Tagline (Optional)</label>
                                <input
                                    type="text"
                                    maxLength={160}
                                    value={formData.tagline}
                                    onChange={(e) => handleChange('tagline', e.target.value)}
                                    placeholder="1-2 sentences summarizing the cause for preview cards..."
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Target Goal (BDT ৳) *</label>
                                <div className="relative mb-3">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 font-black">
                                        ৳
                                    </div>
                                    <input
                                        type="number"
                                        min="1000"
                                        step="500"
                                        value={formData.targetAmount}
                                        onChange={(e) => handleChange('targetAmount', e.target.value)}
                                        placeholder="50000"
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_AMOUNTS.map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => handleChange('targetAmount', amt.toString())}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${formData.targetAmount === amt.toString() ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                                        >
                                            ৳{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Story & Location */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Location & Detailed Story</h2>
                                <p className="text-sm text-slate-500">Specify where the cause is located and share your full story in detail.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Division *</label>
                                    <select
                                        value={formData.division}
                                        onChange={(e) => handleChange('division', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                                    >
                                        {Object.keys(BD_LOCATIONS).map(div => (
                                            <option key={div} value={div}>{div}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">District / Zila *</label>
                                    <select
                                        value={formData.district}
                                        onChange={(e) => handleChange('district', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                                    >
                                        {Object.keys(BD_LOCATIONS[formData.division] || {}).map(dist => (
                                            <option key={dist} value={dist}>{dist}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Upazila / Thana *</label>
                                    <select
                                        value={formData.upazila}
                                        onChange={(e) => handleChange('upazila', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                                    >
                                        {(BD_LOCATIONS[formData.division]?.[formData.district] || []).map(upz => (
                                            <option key={upz} value={upz}>{upz}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Detailed Story & Description * (Supports Bangla & English)</label>
                                <textarea
                                    rows={8}
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Explain the background of the cause, how the funds will be utilized step-by-step, and why urgent support is needed..."
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Visuals, Trust Verification & Submission */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Visuals & Trust Verification Proof</h2>
                                <p className="text-sm text-slate-500">Upload cover photo and verification documents, then review and submit.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Featured Cover Image * (16:9 recommended, Max 5MB)</label>
                                <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-slate-200 border-dashed rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                                            <Upload className="w-10 h-10 mb-2 text-emerald-600" />
                                            <p className="text-sm font-bold text-slate-800">Click to upload or drag and drop cover photo</p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                                </label>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Video / Proof Links (Optional)</label>
                                    <button
                                        type="button"
                                        onClick={handleAddVideoRow}
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                                    >
                                        + Add Link
                                    </button>
                                </div>

                                {videoLinksList.map((link, idx) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                        <input
                                            type="url"
                                            value={link}
                                            onChange={(e) => handleVideoRowChange(idx, e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=... or Google Drive URL"
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 transition"
                                        />
                                        {videoLinksList.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVideoRow(idx)}
                                                className="w-10 h-10 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm transition shrink-0 cursor-pointer"
                                                title="Remove link"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Verification Documents (NID, Passport, Hospital Letters, Chairman Certificate)</label>
                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="w-6 h-6 text-emerald-600" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">{docFile ? docFile.name : 'No verification document attached'}</div>
                                            <div className="text-[11px] text-slate-400">PDF, JPG, PNG (Max 5MB) - Verified campaigns raise 3x more funds.</div>
                                        </div>
                                    </div>
                                    <label className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-slate-200 cursor-pointer shadow-xs">
                                        <span>Browse File</span>
                                        <input type="file" className="hidden" accept=".pdf, image/*" onChange={handleDocChange} />
                                    </label>
                                </div>
                            </div>

                            <hr className="border-slate-100 my-6" />

                            {/* Final Submission Section Card */}
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                                <div className="flex items-center space-x-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={formData.termsAccepted}
                                        onChange={(e) => handleChange('termsAccepted', e.target.checked)}
                                        className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <label htmlFor="terms" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                        I confirm that all information provided is accurate and complies with BDCF Trust & Safety guidelines. *
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Wizard Navigation Buttons */}
                    <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl text-sm transition flex items-center space-x-2 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Previous Step</span>
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center space-x-2 cursor-pointer ml-auto"
                            >
                                <span>Next Step</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={!imagePreview || !formData.termsAccepted}
                                className={`font-extrabold px-8 py-4 rounded-xl text-sm transition flex items-center space-x-2 ml-auto uppercase tracking-wider ${
                                    (!imagePreview || !formData.termsAccepted) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 cursor-pointer'
                                }`}
                            >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Submit Fundraiser for Review</span>
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* Auth Modal if Guest Submits */}
            {showAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 relative space-y-6">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="text-center">
                            <h3 className="text-xl font-black text-slate-900">
                                {isLoginMode ? 'Sign In to Submit' : 'Create Account to Submit'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {isLoginMode ? 'Enter your credentials to publish your fundraiser.' : 'Sign up to manage your fundraisers and donations.'}
                            </p>
                        </div>

                        <form onSubmit={handleAuthSubmit} className="space-y-4">
                            {!isLoginMode && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={authDisplayName}
                                            onChange={(e) => setAuthDisplayName(e.target.value)}
                                            placeholder="Your Name"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 transition"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={authEmail}
                                        onChange={(e) => setAuthEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={authPassword}
                                        onChange={(e) => setAuthPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md shadow-emerald-600/20 cursor-pointer"
                            >
                                {authLoading ? 'Processing...' : (isLoginMode ? 'Sign In & Submit' : 'Create Account & Submit')}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setIsLoginMode(!isLoginMode)}
                                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                            >
                                {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                            </button>
                        </div>

                        <div className="absolute top-4 right-4">
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
