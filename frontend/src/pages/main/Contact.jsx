import Footer from "@/widgets/Footer/Footer";
import ContactDetails from "@/features/contact/ui/ContactDetails";
import ContactForm from "@/features/contact/ui/ContactForm";
import ReviewSlider from "@/shared/components/feedback/ReviewSlider";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";
import PageHeader from "../../shared/components/ui/PageHeader";

const Contact = () => {
  return (
    <div className="min-h-screen bg-richblack-900 text-white">
      <PageHeader
        title="Contact"
        subtitle="We are always ready to assist you"
        description="If you need help or want to contact us, complete the online enquiry form below"
        background={backImg}
        showSearch={false}
      />
      <div className="container mx-auto w-11/12 max-w-maxContent mt-5">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <div className="lg:w-[50%]">
            <ContactDetails />
          </div>
          <div className="lg:w-[50%]">
            <ContactForm />
          </div>
        </div>

        <section className="my-20 px-2 lg:px-0">
          <div className="w-full max-w-5xl">
            <h4 className="text-m font-medium mb-2 text-black">Reviews from other learners</h4>
            <ReviewSlider />
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
