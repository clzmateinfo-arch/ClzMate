import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "@/entities/auth/model/authAPI";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";

export default function UpdatePasswordForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({ confirmPassword: "", password: "" });

    const resetErrors = () => setErrors({ confirmPassword: "", password: "" });

    const handleSubmit = (e) => {
        e.preventDefault();
        resetErrors();

        let hasError = false;
        if (password !== confirmPassword) {
            setErrors((prev) => ({ ...prev, password: "Passwords do not match." }));
            hasError = true;
        }
        if (hasError) return;

        dispatch(resetPassword(password, confirmPassword, token, navigate));
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <Input
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        error={errors.password}
                        showPasswordToggle={true}
                        inputClass="mt-2 mb-5 p-2.5"
                    />
                </div>

                <div>
                    <Input
                        label="Confirm Password"
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        error={errors.confirmPassword}
                        showPasswordToggle={true}
                        inputClass="mt-2 mb-5 p-2.5"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
                    animated={true}
                >
                    Reset Password
                </Button>
            </form>
        </>
    );
}
