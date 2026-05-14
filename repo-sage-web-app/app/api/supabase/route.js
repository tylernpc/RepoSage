import { client } from "../../../lib/supbase";

export async function GET() {
  try {
    const { data, error } = await client
      .from("documents")
      .select("id, content, metadata, created_at, status, checksum")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
