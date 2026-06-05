import { api } from "./api";

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await api.post("/uploads/image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data?.url; // backend returns { url }
}