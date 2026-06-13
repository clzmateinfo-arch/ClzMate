import Button from "@/shared/components/ui/Button";

export default function ConfirmationModal({ modalData }) {
  if (!modalData) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={modalData?.btn2Handler}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg font-semibold text-black">
          {modalData?.text1}
        </p>

        <p className="mt-2 text-sm text-black/70 leading-relaxed">
          {modalData?.text2}
        </p>

        <div className="flex justify-end items-center gap-3 mt-6">
          <Button variant="light" onClick={modalData?.btn2Handler}>
            {modalData?.btn2Text}
          </Button>
          <Button onClick={modalData?.btn1Handler}>
            {modalData?.btn1Text}
          </Button>
        </div>
      </div>
    </div>
  );
}
