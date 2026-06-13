import { useState } from "react";
import { useDispatch } from "react-redux";
import { getPasswordResetToken } from "@/entities/auth/model/authAPI";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";

export default function ForgotPasswordForm() {
    const dispatch = useDispatch();
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        try {
            await dispatch(getPasswordResetToken(email, setEmailSent));
        } catch (err) {
            console.error("Reset request failed:", err);
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
                        error={undefined}
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
