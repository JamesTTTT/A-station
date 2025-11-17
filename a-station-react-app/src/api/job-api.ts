import type { ApiResult, JobCreate, JobResponse } from "@/types";

const baseUrl = import.meta.env.VITE_BASE_URL;

export const startJob = async (
  jobData: JobCreate,
  accessToken: string
): Promise<ApiResult<JobResponse>> => {
  try {
    const response = await fetch(`${baseUrl}/jobs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify(jobData),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (err) {
    console.error(err);
    return { success: false, error: { message: "Server error" } };
  }
};

export const getJobStatus = async (
  jobId: string,
  accessToken: string
): Promise<ApiResult<JobResponse>> => {
  try {
    const response = await fetch(`${baseUrl}/jobs/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.json();
      return { success: false, error };
    }
  } catch (err) {
    console.error(err);
    return { success: false, error: { message: "Server error" } };
  }
};
