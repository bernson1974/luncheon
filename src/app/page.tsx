import Link from "next/link";
import MapWrapper from "@/components/MapWrapper";
import MyLunchButton from "@/components/MyLunchButton";
import { listDates } from "@/lib/store";
import { restaurants } from "@/lib/restaurants";

export default function HomePage() {
  const dates = listDates();

  const pins = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    lat: r.latitude,
    lng: r.longitude,
    dateCount: dates.filter((d) => d.restaurantId === r.id).length
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
      <section style={{ marginBottom: "0.5rem" }}>
        <h1 className="page-title">Luncheon</h1>
        <p className="page-subtitle">
          Hitta lunchsällskap på Lindholmen – här och nu. Inga profiler, inga
          komplicerade algoritmer. Lägg upp en dejt eller joina en som redan
          finns.
        </p>
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <MyLunchButton />

        <Link href="/create" className="home-cta-card">
          <div className="home-cta-title">Lägg upp en lunchdejt</div>
          <div className="home-cta-desc">
            Välj tid, restaurang och samtalsämne. Andra på Lindholmen kan sedan
            joina dig.
          </div>
        </Link>

        <Link href="/browse" className="home-cta-card">
          <div className="home-cta-title">Hitta en lunchdejt</div>
          <div className="home-cta-desc">
            Se alla öppna lunchdejtar för idag. Filtrera på tid, restaurang
            eller ämne och joina den som passar.
          </div>
        </Link>
      </div>

      <div style={{ marginTop: "0.75rem" }}>
        <p className="secondary-text" style={{ marginBottom: "0.5rem" }}>
          Aktiva lunchdejter på Lindholmen idag:
        </p>
        <MapWrapper pins={pins} />
        <p className="secondary-text" style={{ marginTop: "0.4rem", fontSize: "0.75rem" }}>
          Grön siffra = antal dejter på restaurangen. Grå = inga dejter ännu.
        </p>
      </div>

      <p className="secondary-text" style={{ marginTop: "auto", paddingTop: "2rem" }}>
        Begränsat till Lindholmen, Göteborg. Inga publika profiler – ditt alias
        visas enbart för dem i samma dejt.
      </p>
    </div>
  );
}
