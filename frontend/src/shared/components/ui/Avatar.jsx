import { useState } from "react";

export const Avatar = ({ user }) => {
    const [imgError, setImgError] = useState(false);
    const src = user?.image || user?.avatar;

    if (src && !imgError) {
        return (
            <img
                src={src}
                alt={user?.preferredName || user?.firstName || "User avatar"}
                className="h-8 w-8 rounded-full object-cover"
                onError={() => setImgError(true)}
            />
        );
    }

    const firstInitial = user?.preferredName?.[0] || user?.firstName?.[0] || "";
    const lastInitial = user?.lastName?.[0] || "";
    const initials = (firstInitial + lastInitial).toUpperCase();

    return (
        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-violet-600 text-white text-sm font-medium">
            {initials || "U"}
        </div>
    );
};
