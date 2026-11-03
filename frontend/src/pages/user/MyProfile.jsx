 
import { useEffect } from "react";
import { RiEditBoxLine } from "react-icons/ri";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDate } from "@/shared/utils/formatDate";
import IconBtn from "@/shared/components/ui/IconBtn";
import Img from "@/shared/components/ui/Img";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

export default function MyProfile() {
  const { user } = useSelector((state) => state.profile);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const displayName =
    user?.preferredName ||
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  return (
    <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
      <DashboardHeader
        title="My Profile"
        subtitle={`Hi! ${displayName || "Learner"}`}
        background={backImg}
        showSearch={false}
      />
      <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
        <div className="flex flex-col gap-6">
          <section className="m-4 rounded-2xl bg-white/6 border border-white/8 backdrop-blur-md p-6 shadow-sm w-full">
            <div className="flex items-center gap-4">
              <Img
                src={user?.image}
                alt={`profile-${user?.firstName}`}
                className="w-20 h-20 rounded-full object-cover shadow-sm ring-1 ring-white/10"
              />
              <div className="min-w-0">
                <p className="text-xl font-semibold text-richblack-900 truncate">
                  {displayName || "Unnamed User"}
                </p>
                <p className="text-sm text-richblack-400">{user?.email}</p>
                <p className="text-xs text-richblack-400 mt-1">
                  Member since {formatDate(user?.createdAt)}
                </p>
              </div>
            </div>
          </section>
          <section className="m-4 rounded-2xl bg-white/6 border border-white/8 backdrop-blur-md p-6 shadow-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-richblack-900">About</h3>
            </div>
            <p className="text-sm leading-6 text-richblack-600">
              {user?.additionalDetails?.about ??
                "Tell others a little about yourself   interests, skills, what you’re learning."}
            </p>
          </section>

          <div>
            <section className="m-4 rounded-2xl bg-white/6 border border-white/8 backdrop-blur-md p-6 shadow-sm w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-richblack-900">
                  Personal Details
                </h3>
                <IconBtn
                  text="Edit"
                  onClick={() => navigate("/dashboard/settings")}
                  customClasses="bg-violet-600"
                >
                  <RiEditBoxLine />
                </IconBtn>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-4 max-w-2xl">
                  <div>
                    <p className="text-xs text-richblack-400 mb-1">First Name</p>
                    <p className="text-sm font-semibold text-richblack-900 capitalize">
                      {user?.firstName ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-richblack-400 mb-1">Phone Number</p>
                    <p className="text-sm font-semibold text-richblack-900">
                      {user?.additionalDetails?.contactNumber ?? "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-richblack-400 mb-1">Date Of Birth</p>
                    <p className="text-sm font-semibold text-richblack-900">
                      {formatDate(user?.additionalDetails?.dateOfBirth) ??
                        "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-richblack-400 mb-1">Account Type</p>
                    <p className="text-sm font-semibold text-richblack-900 capitalize">
                      {user?.accountType ?? "-"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-richblack-400 mb-1">Last Name</p>
                    <p className="text-sm font-semibold text-richblack-900 capitalize">
                      {user?.lastName ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-richblack-400 mb-1">Email</p>
                    <p className="text-sm font-semibold text-richblack-900">
                      {user?.email ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-richblack-400 mb-1">Gender</p>
                    <p className="text-sm font-semibold text-richblack-900">
                      {user?.additionalDetails?.gender ?? "Not set"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
            <div className="grid grid-cols-1 w-full gap-6 lg:grid-cols-2">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
