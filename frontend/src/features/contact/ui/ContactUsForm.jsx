import * as Icon1 from "react-icons/bi";
import * as Icon2 from "react-icons/io5";
import * as Icon3 from "react-icons/hi2";

const contactDetails = [
  {
    icon: "HiChatBubbleLeftRight",
    heading: "Chat With Us",
    description: "Our friendly team is here to help",
    details: "clzmate.info@gmail.com",
  },
  {
    icon: "IoCall",
    heading: "Call Us",
    description: "Mon - Fri from 8am to 5pm",
    details: "+94 76 007 3341",
  },
];

const ContactDetails = () => {
  return (
    <div className="flex flex-col gap-6 rounded-2xl  p-6 lg:p-8 border border-black">
      {contactDetails.map((ele, i) => {
        let Icon = Icon1[ele.icon] || Icon2[ele.icon] || Icon3[ele.icon];
        return (
          <div className="flex gap-4 items-start" key={i}>
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] to-[#5EEAD4]">
                {Icon ? <Icon className="text-black" size={18} /> : null}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">{ele.heading}</h3>
              </div>
              <p className="mt-1 text-sm text-black">{ele.description}</p>
              <p className="mt-1 text-sm font-medium text-white">{ele.details}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContactDetails;
