import { Link } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";

export default function AuthContent({ title, subtitle, children, maxWidth = "max-w-md" }) {
  return (
    <section className="h-full flex flex-col justify-center items-center p-1 lg:p-10">
      <div className={`w-full ${maxWidth} flex mb-auto self-start mb-1`}>
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-violet-500 hover:text-violet-700 transition-colors"
        >
          <BiArrowBack className="mr-2" />
          Home
        </Link>
      </div>

      <div className={`w-full ${maxWidth} mt-2 pb-5 mb-auto`}>
        {title && <h1 className="text-2xl md:text-3xl mb-4 text-navy">{title}</h1>}
        {subtitle && <p className="text-sm text-gray-600 mb-6">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
