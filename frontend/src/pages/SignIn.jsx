import SignInForm from "@/features/auth/ui/SignInForm";
import backgroundImg from "@/shared/assets/images/auth/sign-in-right-banner.png";

export default function SignIn() {
    const asideQuote = {
        lines: ["The beautiful thing about", "learning is that", "no one can take it away from you"],
        cite: "B.B. King — comforting and empowering",
    };

    return (
        <main className="w-full h-full min-h-screen grid lg:grid-cols-span-auto text-gray-700 lg:grid-cols-[1fr_32rem]">
            <section className="h-full flex flex-col justify-center items-center p-6 lg:p-10">
                <a href="/" className="text-navy flex mb-auto self-start justify-self-start -mt-1">
                </a>
                <div className="w-full max-w-md mt-16 pb-16 mb-auto">
                    <h1 className="text-2xl md:text-3xl mb-8 text-navy">Sign in to Your Account</h1>
                    <SignInForm />
                </div>
            </section>

            <aside className="relative hidden lg:block lg:w-[28rem] xl:w-[32rem] h-full p-16">
                {backgroundImg && (
                    <img src={backgroundImg} alt="hero" className="absolute inset-0 max-w-none w-full h-full object-cover opacity-40" />
                )}

                <blockquote className="mt-10 relative z-20 text-2xl font-heading text-purple-900">
                    {asideQuote.lines.map((l, i) => (
                        <p className="leading-tight" key={i}>
                            {l}
                        </p>
                    ))}
                    <cite className="block not-italic text-xl mt-6">
                        <span className="opacity-40">—</span>
                        {asideQuote.cite}
                    </cite>
                </blockquote>
            </aside>
        </main>
    );
}
