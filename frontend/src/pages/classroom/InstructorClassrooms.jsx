import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import Loading from "@/shared/components/navigation/Loading";
import IconBtn from "@/shared/components/ui/IconBtn";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import Textarea from "@/shared/components/ui/Textarea";
import ClassroomGrid from "@/shared/components/ui/ClassroomGrid";

import { FiPlus, FiLogIn } from "react-icons/fi";

import {
    createClassroomAPI,
    fetchMyClassroomsAPI,
    joinClassroomByCodeAPI,
} from "@/entities/classroom/model/classroomAPI";

import CreateModal from "../../features/classroom/ui/CreateModal";
import JoinModal from "../../features/classroom/ui/JoinModal";

import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

const PAGE_SIZE = 6;

export default function InstructorClassrooms() {
    const { token } = useSelector((s) => s.auth || {});
    const { user } = useSelector((s) => s.profile || {});
    const navigate = useNavigate();

    const [ownedList, setOwnedList] = useState([]);
    const [joinedList, setJoinedList] = useState([]);

    const [ownedPage, setOwnedPage] = useState(1);
    const [joinedPage, setJoinedPage] = useState(1);

    const [ownedHasMore, setOwnedHasMore] = useState(false);
    const [joinedHasMore, setJoinedHasMore] = useState(false);

    const [loadingOwned, setLoadingOwned] = useState(false);
    const [loadingJoined, setLoadingJoined] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [joinOpen, setJoinOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    const loadOwned = useCallback(
        async (page = 1, append = false) => {
            setLoadingOwned(true);
            try {
                const res = await fetchMyClassroomsAPI(token, {
                    type: "owned",
                    page,
                    limit: PAGE_SIZE,
                    search: searchTerm,
                });

                const items = Array.isArray(res?.data) ? res.data : res?.data ?? [];
                const total = Number(res?.total ?? res?.count ?? items.length);

                if (append) setOwnedList((p) => [...p, ...items]);
                else setOwnedList(items);

                setOwnedHasMore(page * PAGE_SIZE < total);
                setOwnedPage(page);
            } catch (err) {
                console.error("Failed to load owned classrooms", err);
                toast.error(err?.message || "Failed to load classrooms");
            } finally {
                setLoadingOwned(false);
            }
        },
        [token, searchTerm]
    );

    const loadJoined = useCallback(
        async (page = 1, append = false) => {
            setLoadingJoined(true);
            try {
                const res = await fetchMyClassroomsAPI(token, {
                    type: "joined",
                    page,
                    limit: PAGE_SIZE,
                    search: searchTerm,
                });

                const items = Array.isArray(res?.data) ? res.data : res?.data ?? [];
                const total = Number(res?.total ?? res?.count ?? items.length);

                if (append) setJoinedList((p) => [...p, ...items]);
                else setJoinedList(items);

                setJoinedHasMore(page * PAGE_SIZE < total);
                setJoinedPage(page);
            } catch (err) {
                console.error("Failed to load joined classrooms", err);
                toast.error(err?.message || "Failed to load classrooms");
            } finally {
                setLoadingJoined(false);
            }
        },
        [token, searchTerm]
    );

    useEffect(() => {
        loadOwned(1, false);
        loadJoined(1, false);
    }, [loadOwned, loadJoined]);

    useEffect(() => {
        const t = setTimeout(() => {
            loadOwned(1, false);
            loadJoined(1, false);
        }, 250);
        return () => clearTimeout(t);
    }, [searchTerm, loadOwned, loadJoined]);

    const handleCreated = async () => {
        setCreateOpen(false);
        await loadOwned(1, false);
    };

    const handleJoined = async () => {
        setJoinOpen(false);
        await loadJoined(1, false);
    };

    const handleOpen = (classroom) => {
        if (!classroom || !classroom._id) return;
        navigate(`/dashboard/classroom/${classroom._id}`);
    };

    const handleMembers = (classroom) => {
        console.log("Show members for", classroom);
    };

    const handleCopyInvite = (inviteCode) => {
        if (!inviteCode) return;
        try {
            navigator.clipboard?.writeText(inviteCode);
            toast.success("Invite code copied");
        } catch (e) {
            console.warn("Copy failed", e);
            toast.error("Failed to copy");
        }
    };

    return (
        <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
            <DashboardHeader
                title="Classrooms"
                subtitle="Create and manage classrooms"
                background={backImg}
                showSearch
                onSearch={(t) => setSearchTerm(t)}
            />

            <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <IconBtn
                            text="Join Class"
                            onClick={() => setJoinOpen(true)}
                            customClasses="bg-white/6 text-black"
                            textClass="text-black"
                        >
                            <FiLogIn />
                        </IconBtn>

                        <IconBtn
                            text="Add Class"
                            onClick={() => setCreateOpen(true)}
                            customClasses="bg-violet-600 text-white"
                        >
                            <FiPlus />
                        </IconBtn>
                    </div>
                </div>

                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-semibold">My Classroom</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Classrooms you own
                            </p>
                        </div>
                        <div className="text-sm text-slate-600">
                            {loadingOwned ? null : (
                                <span>{ownedList.length} classroom{ownedList.length !== 1 ? "s" : ""}</span>
                            )}
                        </div>
                    </div>

                    {loadingOwned && ownedList.length === 0 ? (
                        <Loading />
                    ) : ownedList.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-500">
                            No classrooms found. Create one using "Add Class".
                        </div>
                    ) : (
                        <>
                            <ClassroomGrid
                                classrooms={ownedList}
                                onOpen={handleOpen}
                                onMembers={handleMembers}
                                onCopyInvite={handleCopyInvite}
                            />

                            <div className="mt-4 flex justify-center">
                                {ownedHasMore ? (
                                    <Button
                                        onClick={() => loadOwned(ownedPage + 1, true)}
                                        disabled={loadingOwned}
                                    >
                                        {loadingOwned ? "Loading..." : "Load more"}
                                    </Button>
                                ) : (
                                    ownedList.length > 0 && (
                                        <div className="text-sm text-gray-500">No more classrooms</div>
                                    )
                                )}
                            </div>
                        </>
                    )}
                </section>

                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-semibold">Classrooms You've Joined</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Classrooms where you are a co-instructor or guest
                            </p>
                        </div>
                        <div className="text-sm text-slate-600">
                            {loadingJoined ? null : (
                                <span>{joinedList.length} classroom{joinedList.length !== 1 ? "s" : ""}</span>
                            )}
                        </div>
                    </div>

                    {loadingJoined && joinedList.length === 0 ? (
                        <Loading />
                    ) : joinedList.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-500">
                            You haven't joined any classrooms yet.
                        </div>
                    ) : (
                        <>
                            <ClassroomGrid
                                classrooms={joinedList}
                                onOpen={handleOpen}
                                onMembers={handleMembers}
                                onCopyInvite={handleCopyInvite}
                            />

                            <div className="mt-4 flex justify-center">
                                {joinedHasMore ? (
                                    <Button
                                        onClick={() => loadJoined(joinedPage + 1, true)}
                                        disabled={loadingJoined}
                                    >
                                        {loadingJoined ? "Loading..." : "Load more"}
                                    </Button>
                                ) : (
                                    joinedList.length > 0 && (
                                        <div className="text-sm text-gray-500">No more classrooms</div>
                                    )
                                )}
                            </div>
                        </>
                    )}
                </section>
            </div>

            {createOpen && (
                <CreateModal onClose={() => setCreateOpen(false)} onCreated={handleCreated} token={token} />
            )}

            {joinOpen && (
                <JoinModal onClose={() => setJoinOpen(false)} onJoined={handleJoined} token={token} />
            )}
        </div>
    );
}
