/* eslint-disable react/prop-types */
import IconBtn from "@/shared/components/ui/IconBtn";

export default function ConfirmationModal({ modalData }) {
  return (
    <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center overflow-auto bg-white bg-opacity-10 backdrop-blur-sm">
      <div className="w-10/12 max-w-[350px] rounded-lg border border-black  p-6">
        <p className="text-2xl font-semibold text-black">
          {modalData?.text1}
        </p>

        <p className="mt-3 mb-5 leading-6 text-black">
          {modalData?.text2}
        </p>

        <div className="flex items-center gap-x-4">
          <IconBtn
            onclick={modalData?.btn1Handler}
            text={modalData?.btn1Text}
          />
          <button
            className="cursor-pointer rounded-md  text-black hover: hover:text-black
                                   py-[8px] px-[20px] font-semibold duration-300"
            onClick={modalData?.btn2Handler}
          >
            {modalData?.btn2Text}
          </button>
        </div>
      </div>
    </div>
  );
}
