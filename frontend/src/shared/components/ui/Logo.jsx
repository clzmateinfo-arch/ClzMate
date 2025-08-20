import React from "react";
import { Link } from "react-router-dom";
import companyLogo from "@/shared/assets/images/logo/logo.png";

export const Logo = React.memo(({ onClick }) => (
    <nav aria-label="Logo menu" className="relative z-[60] flex">
        <Link to="/" aria-label="Logo" onClick={onClick}>
            <img src={companyLogo} alt="logo" className="h-18 w-30" loading="lazy" />
        </Link>
        <h1 className="sr-only">Site</h1>
    </nav>
));