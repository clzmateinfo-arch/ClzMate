/* eslint-disable react/prop-types */
import React, { useState } from "react";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import PhoneInput from "@/shared/components/ui/PhoneInput";
import { submitContact } from "@/entities/conatct/model/contactAPI";
import TextArea from "../../../shared/components/ui/TextArea.jsx";

export default function ContactUsForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState({});
  const resetErrors = () =>
    setErrors({ firstName: "", lastName: "", email: "", country: "", phone: "", message: "" });

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 6000);
  };

  const validate = () => {
    const e = {};
    let hasError = false;
    if (!firstName.trim()) {
      e.firstName = "Please enter your first name";
      hasError = true;
    }
    if (!email.trim()) {
      e.email = "Please enter your email";
      hasError = true;
    } else {
      const re = /\S+@\S+\.\S+/;
      if (!re.test(email)) {
        e.email = "Please enter a valid email address";
        hasError = true;
      }
    }
    if (!message.trim()) {
      e.message = "Please enter a message";
      hasError = true;
    }
    if (!phone.trim()) {
      e.message = "Please enter a valid phone number";
      hasError = true;
    }
    setErrors(e);
    return !hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetErrors();

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        email: email?.trim(),
        phone: phone?.trim(),
        message: message?.trim(),
      };

      await submitContact(payload);

      resetForm();
    } catch (err) {
      console.error("Contact submit failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm text-black">
        <h3 className="text-xl font-semibold mb-2 text-black">Get in Touch</h3>
        <p className="text-sm text-black">
          Whether you’ve got questions, feedback, or just want to say hi — we’re here for you.
          Expect replies within 24 hours on business days.
        </p>
      </div>
      <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm mt-3">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="flex flex-col gap-2 lg:w-1/2">
              <Input
                label="First Name"
                id="firstName"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nimantha"
                autoFocus
                required
                error={errors.firstName}
                inputClass="mt-2 mb-5 p-2.5"
              />
            </div>

            <div className="flex flex-col gap-2 lg:w-1/2">
              <Input
                label="Last Name"
                id="lastName"
                name="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Hennayake"
                required
                error={errors.lastName}
                inputClass="mt-2 mb-5 p-2.5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              error={errors.email}
              inputClass="mt-2 mb-5 p-2.5"
            />
          </div>

          <div className="flex flex-col gap-2">
            <PhoneInput
              label="Phone Number"
              value={phone}
              onChange={(v) => setPhone(v)}
              error={errors.phone}
            />
          </div>

          <div className="flex flex-col gap-2">
            <TextArea
              label="Message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a detailed message…"
              autosize
              maxLength={800}
              error={errors.message}
            />
          </div>

          <div className="w-full flex flex-col items-end gap-2">
            <Button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold"
              disabled={loading}
              style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
              animated={true}
            >
              {loading ? "Sending..." : "Send message"}
            </Button>

            <span className="text-sm text-black text-right">
              {sent ? "Message sent — we'll be in touch shortly" : "We’ll reply as soon as possible"}
            </span>
          </div>
        </form>
      </div>
    </>
  );
}
