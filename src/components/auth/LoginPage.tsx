'use client';

import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import AnoAI from '@/components/ui/animated-shader-background';
import { Eye, EyeOff } from 'lucide-react';

const AUTHORIZED_EMAILS = [
    "vaishnaviinnrjy@gmail.com",
    "anishkotikalapudi1@gmail.com"
];

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    
    // Manual Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Capture global layout rejections (Race condition fix)
    useEffect(() => {
        const savedError = localStorage.getItem('authError');
        if (savedError) {
            setError(savedError);
            localStorage.removeItem('authError'); // clear once shown
        }
    }, []);

    const handleError = (err: any) => {
        const code = err.code;
        if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
            setError("Invalid username or password.");
        } else if (code === 'auth/network-request-failed') {
            setError("Connection failed. Please try again.");
        } else if (code === 'auth/too-many-requests') {
            setError("Too many attempts. Please wait and try again.");
        } else {
            setError(err.message || 'Failed to authenticate');
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            if (!user.email || !AUTHORIZED_EMAILS.includes(user.email)) {
                await signOut(auth);
                setError("Access denied. Unauthorized account.");
                setIsLoading(false);
                return;
            }
            
            // On successful login, the listener in ClientLayout will detect the user
        } catch (err: any) {
            console.error("Google Auth failed", err);
            handleError(err);
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email.trim()) {
            setError("Please enter your email address first to reset your password.");
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSuccessMessage("Password reset email sent! Check your inbox to set a password.");
        } catch (err: any) {
            console.error("Password reset failed", err);
            handleError(err);
        }
        setIsLoading(false);
    };

    const handleManualLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const cleanEmail = email.trim();
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, cleanEmail, password);
            } else {
                await signInWithEmailAndPassword(auth, cleanEmail, password);
            }
             // On successful login/signup, the listener in ClientLayout will detect the user
        } catch (err: any) {
            console.error("Manual Auth failed", err);
            handleError(err);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col justify-center items-center p-4 bg-black overflow-hidden">
            <AnoAI />
            <div className="z-10 w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-lg shadow-blue-500/20 mb-6">V</div>
                
                <h1 className="text-2xl font-bold text-white mb-2">Vaishnavi Hotel Manager</h1>
                <p className="text-zinc-400 text-sm mb-6">Secure system access restricted to authorized personnel only.</p>
                
                {error && (
                    <div className="w-full bg-red-900/30 text-red-400 border border-red-900/50 p-3 rounded-lg text-sm mb-6">
                        {error}
                    </div>
                )}
                
                {successMessage && (
                    <div className="w-full bg-green-900/30 text-green-400 border border-green-900/50 p-3 rounded-lg text-sm mb-6">
                        {successMessage}
                    </div>
                )}
                
                <form onSubmit={handleManualLogin} className="w-full space-y-4 mb-6">
                    <div className="text-left">
                        <input 
                            type="email" 
                            placeholder="Email address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="text-left relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                            required
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    
                    {!isSignUp && (
                        <div className="text-right mt-1 mb-4">
                            <button 
                                type="button" 
                                onClick={handleResetPassword}
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20 flex justify-center items-center"
                    >
                        {isLoading ? <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : (isSignUp ? "Create Account" : "Login")}
                    </button>
                    
                    <div className="text-center mt-4">
                        <button 
                            type="button" 
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            {isSignUp ? "Already have an account? Log in" : "Need to set up your account? Sign Up"}
                        </button>
                    </div>
                </form>

                <div className="w-full flex items-center justify-center gap-4 mb-6 text-zinc-500 text-sm">
                    <div className="h-px bg-zinc-700/50 flex-1"></div>
                    <span>or</span>
                    <div className="h-px bg-zinc-700/50 flex-1"></div>
                </div>

                <button 
                    type="button"
                    onClick={handleGoogleSignIn} 
                    disabled={isLoading}
                    className="w-full relative flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black p-3 rounded-xl font-bold shadow transition-all duration-200 disabled:opacity-50"
                >
                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Continue with Google</span>
                </button>
                
                <p className="mt-8 text-xs text-zinc-600">Protected by Firebase Authentication</p>
            </div>
        </div>
    );
}
