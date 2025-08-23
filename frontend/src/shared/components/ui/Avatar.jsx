export const Avatar = ({ user }) => {
    if (user?.avatar) {
        return <img src={user.avatar} alt={user?.preferredName || "User avatar"} className="h-8 w-8 rounded-full object-cover" />;
    }
    const initials = (user?.preferredName ? user.preferredName[0] : "") + (user?.lastName ? user.preferredName[0] : "");
    return (
        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-violet-600 text-white text-sm font-medium">{initials || "U"}</div>
    );
};