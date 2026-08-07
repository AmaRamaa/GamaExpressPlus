import { API_URL, ApiError } from "@/lib/api";

export async function uploadImage(file: File, token: string | null): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || "Upload failed");
  }
  return data;
}
