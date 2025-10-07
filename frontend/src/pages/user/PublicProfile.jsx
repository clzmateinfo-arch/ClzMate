// frontend/src/pages/user/PublicProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiConnector } from "@/shared/services/api/apiConnector";
import { profileEndpoints } from "@/app/config/apis";
import { BiArrowBack } from "react-icons/bi";

const { GET_PUBLIC_PROFILE_API } = profileEndpoints;

function formattedDate(dateStr) {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return dateStr;
    }
}

export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [isProtected, setIsProtected] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) {
            setError("No user id provided in route");
            setLoading(false);
            return;
        }
        (async () => {
            try {
                setLoading(true);
                const resp = await apiConnector("GET", `${GET_PUBLIC_PROFILE_API}/${id}`, null, {});
                if (!resp?.data?.success) {
                    throw new Error(resp?.data?.message || "Failed to fetch public profile");
                }
                const payload = resp.data.data || {};
                setIsProtected(!!payload.isProtected);
                setProfile(payload.user || null);
            } catch (err) {
                console.error("Public profile fetch error", err);
                setError(err?.message || "Failed to fetch profile");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading)
        return (
            <div className="p-6">
                Loading public profile...
            </div>
        );
    if (error)
        return (
            <div className="p-6 text-red-600">
                Error: {error}
            </div>
        );
    if (!profile)
        return (
            <div className="p-6">
                No profile found.
            </div>
        );

    const displayName =
        profile?.preferredName ||
        `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
        "Unnamed User";

    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-12 mt-30">
            <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
                <div className="mb-6">
                    <Link
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center text-sm font-medium text-violet-500 hover:text-violet-700 transition-colors"
                    >
                        <BiArrowBack className="mr-2" />
                        Back
                    </Link>
                </div>

                <section className="m-4 rounded-2xl bg-white/6 border border-white/8 backdrop-blur-md p-6 shadow-sm w-full">
                    <div className="flex items-center gap-4">
                        {profile?.image ? (
                            <img
                                src={profile.image}
                                alt={`profile-${displayName}`}
                                className="w-20 h-20 rounded-full object-cover shadow-sm ring-1 ring-white/10"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-richblack-900">
                                {(displayName || "U").charAt(0)}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xl font-semibold text-richblack-900 truncate">
                                {displayName}
                            </p>
                            {!isProtected && profile?.email && (
                                <p className="text-sm text-richblack-400">{profile.email}</p>
                            )}
                            {!isProtected && profile?.createdAt && (
                                <p className="text-xs text-richblack-400 mt-1">
                                    Member since {formattedDate(profile.createdAt)}
                                </p>
                            )}
                            {isProtected && (
                                <p className="text-sm text-richblack-400 mt-1">
                                    {profile.accountType ?? "Student"}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {isProtected ? (
                    <section className="m-4 rounded-2xl bg-white/6 border border-white/8 backdrop-blur-md p-6 shadow-sm w-full">
                        <div className="text-sm text-richblack-600">
                            This profile is protected. Only basic information is visible.
                        </div>
                        <div className="mt-4">
                            <div className="text-xs text-richblack-400 mb-1">Account Type</div>
                            <div className="text-sm font-semibold text-richblack-900 capitalize">
                                {profile.accountType ?? "-"}
                            </div>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="m-4 rounded-2xl bg-white/6 border border-white/8 backdrop-blur-md p-6 shadow-sm w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-richblack-900">About</h3>
                            </div>
                            <p className="text-sm leading-6 text-richblack-600">
                                {profile?.additionalDetails?.about ??
                                    "Tell others a little about yourself   interests, skills, what you’re learning."}
                            </p>
                        </section>

                        <section className="m-4 rounded-2xl bg-white/6 border border-white/8 backdrop-blur-md p-6 shadow-sm w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-richblack-900">Personal Details</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <div className="flex flex-col gap-4 max-w-2xl">
                                    <div>
                                        <p className="text-xs text-richblack-400 mb-1">First Name</p>
                                        <p className="text-sm font-semibold text-richblack-900 capitalize">
                                            {profile?.firstName ?? "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-richblack-400 mb-1">Phone Number</p>
                                        <p className="text-sm font-semibold text-richblack-900">
                                            {profile?.additionalDetails?.contactNumber ?? "Not set"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-richblack-400 mb-1">Date Of Birth</p>
                                        <p className="text-sm font-semibold text-richblack-900">
                                            {formattedDate(profile?.additionalDetails?.dateOfBirth) ?? "Not set"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-richblack-400 mb-1">Account Type</p>
                                        <p className="text-sm font-semibold text-richblack-900 capitalize">
                                            {profile?.accountType ?? "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div>
                                        <p className="text-xs text-richblack-400 mb-1">Last Name</p>
                                        <p className="text-sm font-semibold text-richblack-900 capitalize">
                                            {profile?.lastName ?? "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-richblack-400 mb-1">Email</p>
                                        <p className="text-sm font-semibold text-richblack-900">
                                            {profile?.email ?? "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-richblack-400 mb-1">Gender</p>
                                        <p className="text-sm font-semibold text-richblack-900">
                                            {profile?.additionalDetails?.gender ?? "Not set"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
