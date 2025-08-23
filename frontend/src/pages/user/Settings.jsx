import ChangeProfilePicture from "../../features/settings/ui/ChangeProfilePicture";
import DeleteAccount from "../../features/settings/ui/DeleteAccount";
import EditProfile from "../../features/settings/ui/EditProfile";
import UpdatePassword from "../../features/settings/ui/UpdatePassword";

export default function Settings() {
  return (
    <>
      <h1 className="mb-14 text-3xl font-medium text-richblack-5 text-center sm:text-left">
        Edit Profile
      </h1>
      {/* Change Profile Picture */}
      <ChangeProfilePicture />
      {/* Profile */}
      <EditProfile />
      {/* Password */}
      <UpdatePassword />
      {/* Delete Account */}
      <DeleteAccount />
    </>
  );
}
