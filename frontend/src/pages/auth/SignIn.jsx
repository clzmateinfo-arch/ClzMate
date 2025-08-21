import AuthContent from "@/features/auth/ui/AuthContent";
import AsidePanel from "@/features/auth/ui/AsidePanel";
import SignInForm from "@/features/auth/ui/SignInForm";
import backgroundImg from "@/shared/assets/images/auth/sign-in-right-banner.png";

export default function SignIn() {
    const asideQuote = {
        lines: ["An investment in knowledge", "pays the best interest"],
        cite: " Benjamin Franklin",
    };

    return (
        <main className="w-full h-full min-h-screen grid lg:grid-cols-span-auto text-gray-700 lg:grid-cols-[1fr_32rem]">

            <AuthContent title="Sign in to Your Account">
                <SignInForm />
            </AuthContent>

            <AsidePanel
                image={backgroundImg}
                lines={asideQuote.lines}
                cite={asideQuote.cite}
                overlay={true}
            />
        </main>
    );
}
