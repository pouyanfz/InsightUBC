/**
 * RoomDistanceDisplay.tsx
 * -------------------------
 * Shows walking distances between selected buildings.
 *
 * - Fetches distance and duration between building coordinates
 * - Displays results in styled cards
 *
 * Used in: MainLayout.tsx
 */

import { useEffect, useState } from "react";

interface Room {
	[key: string]: any;
}

interface DistanceInfo {
	from: string;
	to: string;
	duration: string;
	distance: string;
}

const RoomDistanceDisplay = ({ selectedRooms, datasetId }: { selectedRooms: Room[]; datasetId: string }) => {
	const [distances, setDistances] = useState<DistanceInfo[]>([]);

	useEffect(() => {
		const shortnameKey = `${datasetId}_shortname`;
		const latKey = `${datasetId}_lat`;
		const lonKey = `${datasetId}_lon`;
		const buildings = selectedRooms.reduce((acc: Record<string, any>, room) => {
			if (!acc[room[shortnameKey]]) {
				acc[room[shortnameKey]] = room;
			}
			return acc;
		}, {});

		const uniqueBuildings = Object.values(buildings);

		if (uniqueBuildings.length < 2) {
			setDistances([]);
			return;
		}

		const fetchDistances = async () => {
			const results: DistanceInfo[] = [];

			for (let i = 0; i < uniqueBuildings.length; i++) {
				for (let j = i + 1; j < uniqueBuildings.length; j++) {
					const from = uniqueBuildings[i];
					const to = uniqueBuildings[j];
					const url = `http://localhost:4321/distance?origins=${from[latKey]},${from[lonKey]}&destinations=${to[latKey]},${to[lonKey]}`;

					try {
						const response = await fetch(url);
						const data = await response.json();

						if (data.rows && data.rows[0] && data.rows[0].elements[0] && data.rows[0].elements[0].status === "OK") {
							results.push({
								from: from[shortnameKey],
								to: to[shortnameKey],
								duration: data.rows[0].elements[0].duration.text,
								distance: data.rows[0].elements[0].distance.text,
							});
						}
					} catch (err) {
						console.error("Error fetching distance", err);
					}
				}
			}

			setDistances(results);
		};

		fetchDistances();
	}, [selectedRooms, datasetId]);

	if (distances.length === 0) return null;

	return (
		<div style={{ marginTop: "1rem" }}>
			<h5 style={{ fontWeight: "bold", paddingTop: "1rem" }}>Walking Distances Between Buildings</h5>
			<div
				className="row row-cols-1 row-cols-md-2 row-cols-md-3  g-3 mt-2 "
				style={{ overflowY: "auto", overflowX: "hidden", marginRight: 0 }}
			>
				{distances.map((d, i) => (
					<div className="col" key={i}>
						<div className="card bg-primary-subtle shadow rounded">
							<div className="card-body">
								<h5 className="card-title">
									📍 {d.from} ↔️ {d.to} 🏁
								</h5>
								<p className="card-text">
									🚶‍♂️ <strong>{d.duration}</strong>
									<br />
									📏 {d.distance}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default RoomDistanceDisplay;
