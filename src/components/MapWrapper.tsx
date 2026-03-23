"use client";

import dynamic from "next/dynamic";

interface RestaurantPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dateCount: number;
  oneSpotLeft?: boolean;
}

const LindholmenMap = dynamic(() => import("./LindholmenMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "442px",
        borderRadius: "0.75rem",
        background: "#e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontSize: "0.85rem"
      }}
    >
      Loading map…
    </div>
  )
});

export default function MapWrapper({
  pins,
  selectedYmd,
  greyedOut,
}: {
  pins: RestaurantPin[];
  selectedYmd: string;
  greyedOut?: boolean;
}) {
  return <LindholmenMap pins={pins} selectedYmd={selectedYmd} greyedOut={greyedOut} />;
}
