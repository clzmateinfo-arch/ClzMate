// enrollmentAPI.js
import axios from "axios";

/**
 * All functions expect `token` (JWT) when called from client.
 */

export const fetchCourseEnrollmentRequests = async (courseId, token) => {
    const res = await axios.get(`/api/course/enrollmentRequests/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const respondEnrollmentRequest = async (courseId, requestId, action, note = "", token) => {
    const res = await axios.post(
        `/api/course/enrollmentRequests/${courseId}/${requestId}/respond`,
        { action, note },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const requestEnrollmentForCourse = async (courseId, token) => {
    const res = await axios.post(
        `/api/course/requestEnrollment`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Student-side: fetch current user's enrollment requests (pending/approved/rejected)
// Backend route expected: GET /api/user/enrollment-requests
export const fetchMyEnrollmentRequests = async (token) => {
    const res = await axios.get(`/api/user/enrollment-requests`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};
