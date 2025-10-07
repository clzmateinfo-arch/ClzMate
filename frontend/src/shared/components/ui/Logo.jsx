import React from "react";
import { Link } from "react-router-dom";
import companyLogo from "@/shared/assets/images/logo/logo.png";

const Logo = React.memo(({ onClick }) => (
    <>
        <Link to="/" aria-label="Logo">
            <img
                src={companyLogo}
                alt="logo"
                className="h-12 w-auto object-contain"
                loading="lazy"
            />
        </Link>
        <span className="font-heading text-2xl xs:text-2xl ml-2 mr-4 -mt-1 sm:text-2xl md:text-2xl lg:text-2xl xl:text-6.5xl !tracking-[-.045em] relative text-nav leading-tight/[1.15]"><strong><Link to="/">Up!</Link></strong></span>
    </>
));

const LogoWithoutImage = React.memo(({ onClick }) => (
    <>
        <span className="font-heading text-2xl xs:text-2xl ml-2 mr-4 -mt-1 sm:text-2xl md:text-2xl lg:text-2xl xl:text-6.5xl !tracking-[-.045em] relative text-nav leading-tight/[1.15]"><strong><Link to="/">Up!</Link></strong></span>
    </>
));

export { Logo, LogoWithoutImage }
