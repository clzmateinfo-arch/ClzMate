import ChangeProfilePicture from "../../features/settings/ui/ChangeProfilePicture";
import DeleteAccount from "../../features/settings/ui/DeleteAccount";
import EditProfile from "../../features/settings/ui/EditProfile";
import UpdatePassword from "../../features/settings/ui/UpdatePassword";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

export default function Settings() {
  return (
    <div className="bg-transparent text-richblack-900 min-h-screen pb-12">
      <DashboardHeader
        title="Settings"
        subtitle="Manage your settings here"
        background={backImg}
        showSearch={false}
      />
      <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
        <ChangeProfilePicture />
        {/* <div className="flex flex-col gap-5 lg:flex-row">
          <div className="relative flex flex-col gap-2 lg:w-1/2"> */}
            <EditProfile />
          {/* </div>
          <div className="relative flex flex-col gap-2 lg:w-1/2"> */}
            <UpdatePassword />
            <DeleteAccount />
          {/* </div>
        </div> */}
      </div>
    </div>
  );
}
