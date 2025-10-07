import AuthContent from "@/features/auth/ui/AuthContent";
import AsidePanel from "@/features/auth/ui/AsidePanel";
import SignupForm from "@/features/auth/ui/SignupForm";
import backgroundImg from "@/shared/assets/images/auth/sign-up-right-banner.png";

export default function SignUp() {
  const asideQuote = {
    lines: ["Education is not preparation for life,", " education is life itself"],
    cite: "John Dewey",
  };

  return (
    <main className="w-full min-h-screen grid lg:grid-cols-[1fr_32rem] text-gray-700">
      <AuthContent title="Sign up for an Account">
        <SignupForm />
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