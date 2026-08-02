import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

export default function AppAccessGate({ app, naam, children }) {
  const [staat, setStaat] = useState("laden");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);

  useEffect(() => {
    let actief = true;

    async function ophalen() {
      const { data: sessie } = await supabase.auth.getSession();
      if (!sessie?.session) {
        if (actief) setStaat("uitgelogd");
        return;
      }

      const { data, error } = await supabase
        .from("app_access")
        .select("status")
        .eq("app", app)
        .maybeSingle();

      if (!actief) return;

      if (error) {
        setFout(error.message);
        setStaat("fout");
        return;
      }

      setStaat(data ? data.status : "geen");
    }

    ophalen();
    const { data: luisteraar } = supabase.auth.onAuthStateChange(() => ophalen());
    return () => {
      actief = false;
      luisteraar?.subscription?.unsubscribe();
    };
  }, [app]);

  async function aanvragen() {
    setBezig(true);
    setFout(null);

    const { data: sessie } = await supabase.auth.getSession();
    const userId = sessie?.session?.user?.id;
    if (!userId) {
      setFout("Je sessie is verlopen. Log opnieuw in.");
      setBezig(false);
      return;
    }

    const { error } = await supabase
      .from("app_access")
      .insert({ user_id: userId, app, status: "pending" });

    setBezig(false);
    if (error) {
      setFout(error.message);
      return;
    }
    setStaat("pending");
  }

  if (staat === "active") return children;
  if (staat === "laden") return null;
  if (staat === "uitgelogd") return children;

  const titel = naam || app;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8">
        {staat === "geen" && (
          <>
            <h1 className="text-lg font-semibold text-slate-900">Toegang tot {titel}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Je account heeft nog geen toegang tot deze app. Vraag toegang aan;
              je krijgt bericht zodra die is verleend.
            </p>
            <button
              onClick={aanvragen}
              disabled={bezig}
              className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
            >
              {bezig ? "Bezig…" : "Toegang aanvragen"}
            </button>
          </>
        )}

        {staat === "pending" && (
          <>
            <h1 className="text-lg font-semibold text-slate-900">Aanvraag verstuurd</h1>
            <p className="mt-2 text-sm text-slate-600">
              Je aanvraag voor {titel} staat klaar voor goedkeuring. Ververs deze
              pagina zodra je toegang hebt gekregen.
            </p>
          </>
        )}

        {staat === "blocked" && (
          <>
            <h1 className="text-lg font-semibold text-slate-900">Geen toegang</h1>
            <p className="mt-2 text-sm text-slate-600">
              Je account heeft geen toegang tot {titel}.
            </p>
          </>
        )}

        {staat === "fout" && (
          <>
            <h1 className="text-lg font-semibold text-slate-900">
              Toegang kon niet worden gecontroleerd
            </h1>
            <p className="mt-2 text-sm text-slate-600">{fout}</p>
          </>
        )}

        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-4 w-full text-sm text-slate-500 hover:text-slate-900"
        >
          Uitloggen
        </button>
      </div>
    </div>
  );
}
