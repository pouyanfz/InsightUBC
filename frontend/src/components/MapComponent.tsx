/**
 * MapComponent.tsx
 * -----------------
 * Shows a map with building markers using Google Maps.
 *
 * - Displays each building as a marker with a label and address
 * - Highlights the selected building
 * - Shows info window on marker click
 *
 * Used in: MainLayout.tsx
 */

import { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from "@vis.gl/react-google-maps";

type Poi = { key: string; location: google.maps.LatLngLiteral; label: string; address: string };

const PoiMarkers = ({ highlightedBuilding, datasetId }: { highlightedBuilding: string | null; datasetId: string }) => {
	const [locations, setLocations] = useState<Poi[]>([]);
	const [selected, setSelected] = useState<Poi | null>(null);

	useEffect(() => {
		const fetchBuildings = async () => {
			const query = {
				WHERE: {},
				OPTIONS: {
					COLUMNS: [
						`${datasetId}_fullname`,
						`${datasetId}_shortname`,
						`${datasetId}_lon`,
						`${datasetId}_lat`,
						`${datasetId}_address`,
					],
				},
				TRANSFORMATIONS: {
					GROUP: [
						`${datasetId}_fullname`,
						`${datasetId}_shortname`,
						`${datasetId}_lon`,
						`${datasetId}_lat`,
						`${datasetId}_address`,
					],
					APPLY: [],
				},
			};

			try {
				const res = await fetch("http://localhost:4321/query", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(query),
				});
				const data = await res.json();
				const pois = data.result.map((b: any) => ({
					key: b[`${datasetId}_shortname`],
					location: { lat: b[`${datasetId}_lat`], lng: b[`${datasetId}_lon`] },
					label: b[`${datasetId}_fullname`],
					address: b[`${datasetId}_address`],
				}));
				setLocations(pois);
			} catch (err) {
				console.error("Could not get building information for map component", err);
			}
		};

		fetchBuildings();
	}, [datasetId]);

	return (
		<>
			{locations.map((poi) => (
				<AdvancedMarker
					key={poi.key}
					position={poi.location}
					style={{ cursor: "pointer" }}
					title={poi.label}
					onClick={() => setSelected(poi)}
				>
					<Pin
						background={poi.key === highlightedBuilding ? "#4285F4" : "#FFBC04"}
						glyphColor="#000"
						borderColor="#000"
						glyph={poi.key}
					/>
				</AdvancedMarker>
			))}

			{selected && (
				<InfoWindow position={selected.location} onCloseClick={() => setSelected(null)}>
					<div style={{ textAlign: "center", lineHeight: "1.5", fontWeight: "bold" }}>
						<div style={{ color: "blue", marginBottom: "0.5rem" }}>{selected.key}</div>
						<div style={{ fontSize: "0.95rem", paddingBottom: "0.5rem" }}>{selected.label}</div>
						<div style={{ fontSize: "0.9rem", color: "#555" }}>{"📍 " + selected.address}</div>
					</div>
				</InfoWindow>
			)}
		</>
	);
};

const MapComponent = ({
	highlightedBuilding,
	datasetId,
}: {
	highlightedBuilding: string | null;
	datasetId: string;
}) => (
	<div style={{ height: "35vh", width: "100%", padding: "0.5rem" }}>
		<APIProvider apiKey={"API KEY"} onLoad={() => console.log("Maps API has loaded.")}>
			<Map defaultZoom={14.8} defaultCenter={{ lat: 49.265939699964534, lng: -123.2499468989502 }} mapId="demo">
				<PoiMarkers highlightedBuilding={highlightedBuilding} datasetId={datasetId} />
			</Map>
		</APIProvider>
	</div>
);

export default MapComponent;
