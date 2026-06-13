import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal";
import Button from "@/shared/components/ui/Button";
import { deleteProfile } from "@/entities/settings/model/SettingsAPI";

export default function DeleteAccount() {
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [checked, setChecked] = useState(false);

  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const openConfirm = () => {
    if (!checked) return;
    setConfirmationModal({
      text1: "Delete account?",
      text2:
        "This action is irreversible. Deleting your account will permanently remove all associated content, including paid courses.",
      btn1Text: "Delete",
      btn2Text: "Cancel",
      btn1Handler: () => {
        dispatch(deleteProfile(token, navigate));
        setConfirmationModal(null);
        setChecked(false);
      },
      btn2Handler: () => {
        setConfirmationModal(null);
      },
    });
  };

  return (
    <>
      <div className="items-center justify-between rounded-xl border border-white/10 bg-red-500/20 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6 mb-3 mt-3 sm:p-8 text-black">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 mt-1 items-center justify-center rounded-full bg-pink-600/95 shadow-sm">
              <FiTrash2 className="text-2xl text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">Delete Account</h2>

            <div className="text-sm text-muted-foreground text-black/70 space-y-3">
              <p>Would you like to delete your account?</p>
              <p>
                This account may contain paid courses. Deleting your account is permanent and will remove
                all content associated with it.
              </p>
              <label className="flex items-center gap-3 cursor-pointer select-none mt-4">
                <input
                  type="checkbox"
                  aria-label="Confirm delete account"
                  checked={checked}
                  onChange={() => setChecked((c) => !c)}
                  className="h-4 w-4 rounded border-gray-200 text-pink-600 bg-white cursor-pointer"
                />
                <span className="text-sm text-black/80 italic">I understand and want to delete my account.</span>
              </label>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  className={`text-sm min-w-[160px] ${!checked ? "opacity-60 pointer-events-none" : ""}`}
                  style={checked ? { boxShadow: "0 6px 18px rgba(236,72,153,0.12)" } : {}}
                  onClick={openConfirm}
                  animated={true}
                >
                  Delete account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  );
}
