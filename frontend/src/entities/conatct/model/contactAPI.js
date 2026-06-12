// src/entities/contact/model/contactAPI.js
import { apiConnector } from "@/shared/services/api/apiConnector";
import { contactusEndpoint } from "@/app/config/apis";
import { showToast } from "@/shared/components/feedback/CustomToast";

const {
    CONTACT_US_API
} = contactusEndpoint;

function extractErrorMessage(error) {
    return (
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again."
    );
}

export async function submitContact(payload) {

    try {
        const response = await apiConnector("POST", CONTACT_US_API, payload, {
            "Content-Type": "application/json",
        });

        if (!response?.data?.success) {
            throw new Error(response?.data?.message || "Failed to send message");
        }

        showToast("Message sent, we'll reply shortly", "success");
        return response.data;
    } catch (error) {
        console.error("CONTACT API ERROR ->", error);
        showToast(
            `Ops! ${extractErrorMessage(error)}`,
            "error"
        );
    }
}
