import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPasswordResetToken } from "@/entities/auth/model/authAPI";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import { useLocation } from "react-router-dom";

export default function ForgotPasswordForm() {
    const dispatch = useDispatch();
    const { loading } = useSelector((s) => s.auth || {});
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false); "focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_6px_rgba(153,107,236,0.12)]";

    useEffect(() => {
        if (!loading) setBusy(false);
    }, [loading, useLocation().pathname]);

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
                    <Input
                        label="Email Address"
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoFocus
                        required
                        error={errors.email}
                        inputClass="mt-2 mb-5 p-2.5"
                    />
                )}

                <div>
                    <Button
                        type="submit"
                        className="w-full"
                        style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
                        animated={true}
                    >
                        {!emailSent ? "Send Reset Instructions" : "Resend Email"}
                    </Button>

                </div>
            </form>
        </>
    );
}
