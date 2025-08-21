export default function AuthContent({ title, subtitle, children, maxWidth = "max-w-md" }) {
  return (
    <section className="h-full flex flex-col justify-center items-center p-6 lg:p-10">
      <a href="/" className="text-navy flex mb-auto self-start -mt-1" aria-label="Home">
        {/* optionally put a small logo here */}
      </a>

      <div className={`w-full ${maxWidth} mt-5 pb-16 mb-auto`}>
        {title && <h1 className="text-2xl md:text-3xl mb-4 text-navy">{title}</h1>}
        {subtitle && <p className="text-sm text-gray-600 mb-6">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
