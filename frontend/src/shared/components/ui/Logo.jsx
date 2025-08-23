import React from "react";
import { Link } from "react-router-dom";
import companyLogo from "@/shared/assets/images/logo/logo.png";

export const Logo = React.memo(({ onClick }) => (
    <nav aria-label="Logo menu" className="relative z-[60] flex items-center">
        <Link to="/" aria-label="Logo" onClick={onClick} className="flex items-center">
            <img
                src={companyLogo}
                alt="logo"
                className="h-17 w-auto object-contain"
                loading="lazy"
            />
        </Link>
        <h1 className="sr-only">Site</h1>
    </nav>
));
