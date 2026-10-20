import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { HeartHandshake, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';

const signupSchema = z.object({
    displayName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

export default function SignupForm() {
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(signupSchema)
    });

    const onSubmit = async (data) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.detail || resData.error || 'Registration failed');
            }

            toast.success(resData.message || 'Verification code sent to your email!');
            navigate('/verify-otp', { state: { email: data.email } });
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div>
            <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                    <HeartHandshake className="w-6 h-6 stroke-[2.5]" />
                </div>
            </div>

            <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2">
                Create your account
            </h2>
            <p className="text-center text-sm text-slate-500 mb-8">
                Already have an account?{' '}
                <Link
                    to="/login"
                    className="font-bold text-emerald-600 hover:text-emerald-700 focus:outline-none underline"
                >
                    Sign in
                </Link>
            </p>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Full Name</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <User className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            {...register('displayName')}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400 transition"
                            placeholder="Full Name"
                        />
                    </div>
                    {errors.displayName && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.displayName.message}</span>}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                        </div>
                        <input
                            type="email"
                            {...register('email')}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400 transition"
                            placeholder="name@example.com"
                        />
                    </div>
                    {errors.email && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.email.message}</span>}
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                        </div>
                        <input
                            type="password"
                            {...register('password')}
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400 transition"
                            placeholder="••••••••"
                        />
                    </div>
                    {errors.password && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.password.message}</span>}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition duration-300 disabled:opacity-50 text-sm tracking-wide uppercase cursor-pointer"
                    >
                        {isSubmitting ? 'Processing...' : 'Create Account'}
                    </button>
                </div>
            </form>
        </div>
    );
}
