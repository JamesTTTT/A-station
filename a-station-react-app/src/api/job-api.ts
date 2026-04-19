import type { ApiResult, JobCreate, JobResponse } from "@/types";
import { apiFetch } from "@/api/client";

export const startJob = async (
  jobData: JobCreate,
): Promise<ApiResult<JobResponse>> => {
  try {
    const response = await apiFetch(`/jobs/`, {
      method: "POST",
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
): Promise<ApiResult<JobResponse>> => {
  try {
    const response = await apiFetch(`/jobs/${jobId}`, { method: "GET" });

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
