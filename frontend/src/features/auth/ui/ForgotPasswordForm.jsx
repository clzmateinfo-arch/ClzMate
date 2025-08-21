import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPasswordResetToken } from "@/entities/auth/model/authAPI";

export default function ForgotPasswordForm() {
    const dispatch = useDispatch();
    const { loading } = useSelector((s) => s.auth || {});
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [busy, setBusy] = useState(false); "focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_6px_rgba(153,107,236,0.12)]";

    useEffect(() => {
        if (!loading) setBusy(false);
    }, [loading]);

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setBusy(true);
        try {
            await dispatch(getPasswordResetToken(email, setEmailSent));
        } catch (err) {
            console.error("Reset request failed:", err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <form onSubmit={handleOnSubmit} className="space-y-4" noValidate>
                {!emailSent && (
                    <label className="block text-sm font-medium text-navy" htmlFor="reset_email">
                        Your Email
                        <input
                            autoCapitalize="off"
                            autoCorrect="off"
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(153,107,236,0.12)]"
                            placeholder="you@example.com"
                            aria-label="Email address"
                        />
                    </label>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={busy || loading}
                        className="btn-purple w-full bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white py-3 rounded-md font-medium bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors"
                        style={!emailSent ? { boxShadow: "0 6px 18px rgba(80,70,228,0.16)" } : {}}
                        aria-busy={busy || loading}
                    >
                        {(busy || loading) && (
                            <svg
                                className={`animate-spin -ml-1 mr-3 h-5 w-5 ${emailSent ? "text-gray-800" : "text-white"}`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        )}
                        {!emailSent ? "Send Reset Instructions" : "Resend Email"}
                    </button>
                </div>
            </form>
        </>
    );
}
