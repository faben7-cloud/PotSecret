import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("public_contributions")
    .select("*");

  console.log("TEST contributions:", data, error);

  return (
    <div style={{ padding: 20 }}>
      <h1>Test Supabase</h1>
      <p>Regarde la console serveur</p>
    </div>
  );
}