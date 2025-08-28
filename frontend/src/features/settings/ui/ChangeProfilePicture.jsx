import { useEffect, useRef, useState } from "react";
import { FiUpload } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { updateUserProfileImage } from "@/entities/settings/model/SettingsAPI";
import IconBtn from "@/shared/components/ui/IconBtn";
import Img from "@/shared/components/ui/Img";

export default function ChangeProfilePicture() {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewSource, setPreviewSource] = useState(null);

  const fileInputRef = useRef(null);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      previewFile(file);
    }
  };

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => setPreviewSource(reader.result);
  };

  const handleFileUpload = () => {
    if (!profileImage) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("profileImage", profileImage);

      dispatch(updateUserProfileImage(token, formData)).finally(() =>
        setLoading(false)
      );
    } catch (error) {
      console.error("ERROR MESSAGE - ", error.message);
    }
  };

  useEffect(() => {
    if (profileImage) previewFile(profileImage);
  }, [profileImage]);

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6 mb-3 mt-3 sm:p-8 text-black">
      <div className="flex items-center gap-5">
        <Img
          src={previewSource || user?.image}
          alt={`profile-${user?.firstName}`}
          className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20 shadow-md"
        />

        <div className="space-y-2">
          <p className="font-semibold text-sm text-black/80">
            Change Profile Picture
          </p>

          <div className="py-2 flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/gif, image/jpeg, image/jpg"
            />

            <div className="mt-3">
              <IconBtn
                text="Select"
                onClick={handleClick}
                disabled={loading}
                className="m-1"
              />

              <IconBtn
                text={loading ? "Uploading..." : "Upload"}
                onClick={handleFileUpload}
                disabled={loading}
                className="m-1"
              >
                {!loading && <FiUpload className="text-lg" />}
              </IconBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
