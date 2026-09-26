import { auth, isAdminEmail } from "@/auth";
import { db } from "@/db";
import { images } from "@/db/schema";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (!TYPES.includes(file.type)) return Response.json({ error: "Use a JPG, PNG, WebP or GIF." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "That image is over 5 MB." }, { status: 400 });

  const [row] = await db
    .insert(images)
    .values({ contentType: file.type, data: Buffer.from(await file.arrayBuffer()) })
    .returning({ id: images.id });
  return Response.json({ id: row.id });
}
