"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

const places = [
  {
    name: "Ons verblijf",
    detail: "Via Properzio 32 · Prati",
    position: [41.90544473617383, 12.461041291536137] as [number, number],
    query: "Via Properzio 32, 00193 Rome, Italy",
    type: "basis",
  },
  {
    name: "Vaticaanse Necropolis",
    detail: "Rondleiding · zaterdag 10:45",
    position: [41.9026, 12.4536] as [number, number],
    query: "Vatican Necropolis, Rome, Italy",
    type: "plan",
  },
  {
    name: "Castel Sant’Angelo",
    detail: "Aan de Tiber",
    position: [41.902563, 12.467361] as [number, number],
    query: "Castel Sant'Angelo, Rome, Italy",
    type: "plek",
  },
  {
    name: "Pantheon",
    detail: "Historisch centrum",
    position: [41.898611, 12.476833] as [number, number],
    query: "Pantheon, Rome, Italy",
    type: "plek",
  },
  {
    name: "Trevi Fountain",
    detail: "Een muntje voor de terugreis",
    position: [41.900933, 12.483278] as [number, number],
    query: "Trevi Fountain, Rome, Italy",
    type: "plek",
  },
  {
    name: "Colosseum",
    detail: "Antiek Rome",
    position: [41.8902, 12.4922] as [number, number],
    query: "Colosseum, Rome, Italy",
    type: "plek",
  },
];

const mapBounds: [[number, number], [number, number]] = [
  [41.887, 12.448],
  [41.91, 12.497],
];

function markerColor(type: string) {
  if (type === "basis") return "#76142a";
  if (type === "plan") return "#ce0f3d";
  return "#b31c38";
}

export function RomeMap() {
  return (
    <div className="overflow-hidden rounded-[2rem] bg-white/55 p-3 shadow-[7px_8px_0_#76142a] sm:p-4">
      <MapContainer bounds={mapBounds} className="h-[28rem] w-full rounded-[1.45rem] sm:h-[34rem]" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.map((place) => (
          <CircleMarker
            center={place.position}
            fillColor={markerColor(place.type)}
            fillOpacity={1}
            key={place.name}
            pathOptions={{ color: "#ffd2dd", weight: place.type === "basis" ? 5 : 3 }}
            radius={place.type === "basis" ? 11 : 8}
          >
            <Popup>
              <div className="min-w-40 font-sans text-[#76142a]">
                <p className="font-semibold">{place.name}</p>
                <p className="mt-1 text-sm text-[#76142a]/70">{place.detail}</p>
                <a
                  className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open in Google Maps
                </a>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="grid gap-x-5 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <a
            className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-[#ffd2dd]/70"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`}
            key={place.name}
            rel="noreferrer"
            target="_blank"
          >
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full border-2 border-[#ffd2dd]" style={{ backgroundColor: markerColor(place.type) }} />
            <span>
              <span className="block text-sm font-medium">{place.name}</span>
              <span className="block text-xs text-[#b31c38]/65">{place.detail}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
