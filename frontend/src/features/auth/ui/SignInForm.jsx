import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "@/entities/auth/model/authAPI";

export default function SignInForm() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login(email, password, navigate));
    };

    const inputCls =
        "mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 " +
        "focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_6px_rgba(153,107,236,0.12)]";

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-2">
                <a
                    href="/app/auth/facebook?state=phoenix"
                    className="flex items-center justify-center gap-2 border border-[#E9EFF5] rounded-md py-3 px-4 sm:flex-1 hover:shadow-sm transition"
                    aria-label="Sign in with Facebook"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                        <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07C2 17.09 5.66 21.13 10.44 21.95v-6.96H7.9v-2.99h2.54V9.77c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.23 0-1.61.77-1.61 1.56v1.88h2.74l-.44 2.99h-2.3v6.96C18.34 21.13 22 17.09 22 12.07z" />
                    </svg>

                    <span>Sign in with Facebook</span>
                </a>

                <a
                    href="/app/auth/google?state=phoenix"
                    className="flex items-center justify-center gap-2 border border-[#E9EFF5] rounded-md py-3 px-4 sm:flex-1 hover:shadow-sm transition"
                    aria-label="Sign in with Google"
                >
                    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
                        <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
                    </svg>
                    <span>Sign in with Google</span>
                </a>
            </div>

            {/* divider */}
            <div className="relative my-2 mt-5 mb-5">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#E9EFF5]" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-400 font-medium">or</span>
                </div>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <label className="block text-sm font-medium text-navy">
                    Email Address
                    <input
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoFocus
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputCls}
                        placeholder="you@example.com"
                    />
                </label>

                <div>
                    <label className="block text-sm font-medium text-navy">
                        Password
                        <div className="relative mt-2 mb-5">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputCls + " pr-10"}
                                aria-label="Password"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xl"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                            </button>
                        </div>
                    </label>

                    <a
                        href="/app/password_resets/new"
                        className="text-violet-600 hover:text-violet-700 text-sm transition-colors inline-block mt-2 mb-2"
                    >
                        Forgotten password?
                    </a>
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white py-3 rounded-md font-medium"
                    style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
                >
                    Sign In
                </button>

                <div className="text-center text-sm mt-5">
                    <span>By signing in you agree to our </span>
                    <a
                        className="text-navy underline underline-offset-2 decoration-1 decoration-navy-300 hover:text-violet-600 transition-all"
                        href="/legal/terms-of-service/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        terms of service
                    </a>
                    <span> and </span>
                    <a
                        className="text-navy underline underline-offset-2 decoration-1 decoration-navy-300 hover:text-violet-600 transition-all"
                        href="/legal/privacy-policy/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        privacy policy
                    </a>
                </div>

                <a href="/signup" className="btn btn-link w-full block text-center text-sm text-violet-600 mt-10">
                    Need an Account?
                </a>
            </form>
        </>
    );
}
