/**
 * MainLayout.tsx
 * ---------------
 * Main screen for the Campus Room Finder app.
 *
 * - Shows map, room selector, distances, table, and chart
 * - Manages selected rooms and highlighted building
 *
 * Used in: App.tsx
 */

import { useState, useEffect } from "react";
import BuildingRoomSelector from "./BuildingRoomSelector";
import SelectedRoomsTable from "./SelectedRoomsTable";
import RoomDistanceDisplay from "./RoomDisplayDistance";
import RoomCapacityChart from "./RoomCapacityChart";
import MapComponent from "./MapComponent";

const MainLayout = () => {
	const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
	const [allRooms, setAllRooms] = useState<any[]>([]);
	const [highlightedBuilding, setHighlightedBuilding] = useState<string | null>(null);
	const [datasetId, setDatasetId] = useState<string>("");
	const [datasetMissing, setDatasetMissing] = useState(false);

	useEffect(() => {
		const fetchDatasetId = async () => {
			try {
				const res = await fetch("http://localhost:4321/datasets");
				const data = await res.json();
				const roomDataset = data.result.find((d: any) => d.kind === "rooms");
				if (roomDataset) {
					setDatasetId(roomDataset.id);
				} else {
					setDatasetMissing(true);
				}
			} catch (err) {
				console.error("Failed to fetch dataset ID", err);
				setDatasetMissing(true);
			}
		};
		fetchDatasetId();
	}, []);

	const handleRemoveRoom = (roomName: string) => {
		setSelectedRooms((prev) => prev.filter((r) => r[`${datasetId}_name`] !== roomName));
	};

	return (
		<div style={{ display: "flex", flexDirection: "column", minHeight: "75vh" }}>
			<header
				style={{
					borderBottom: "1px solid #ccc",
					backgroundColor: "#002145",
					color: "white",
					padding: "1rem",
					textAlign: "center",
					fontSize: "2rem",
					fontWeight: "bold",
				}}
			>
				Campus Room Finder
			</header>

			<div style={{ display: "flex", height: "67vh", borderBottom: "1px solid #ccc" }}>
				{/* Left side: Map + Cards */}
				<div
					style={{ flex: 2, borderRight: "1px solid #ccc", padding: "1rem", display: "flex", flexDirection: "column" }}
				>
					<div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
						<div style={{ flex: 1 }}>
							<MapComponent highlightedBuilding={highlightedBuilding} datasetId={datasetId} />
						</div>
						<div style={{ flex: 1, overflowY: "auto", marginTop: "1rem" }}>
							<RoomDistanceDisplay selectedRooms={selectedRooms} datasetId={datasetId} />
						</div>
					</div>
				</div>

				{/* Right Side: Room Selector Component */}
				<div style={{ flex: 1, padding: "1rem", overflowY: "auto", maxHeight: "100%" }}>
					<BuildingRoomSelector
						selectedRooms={selectedRooms}
						setSelectedRooms={setSelectedRooms}
						setAllRooms={setAllRooms}
						setHighlightedBuilding={setHighlightedBuilding}
						datasetId={datasetId}
					/>
				</div>
			</div>

			<div style={{ padding: "2rem" }}>
				{selectedRooms.length > 0 && (
					<>
						<h3 style={{ fontWeight: "bold" }}>Selected Room Details</h3>
						<SelectedRoomsTable selectedRooms={selectedRooms} datasetId={datasetId} onRemove={handleRemoveRoom} />
					</>
				)}
				<RoomCapacityChart selectedRooms={selectedRooms} allRooms={allRooms} datasetId={datasetId} />
			</div>
			{datasetMissing && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						width: "100vw",
						height: "100vh",
						backgroundColor: "rgba(0, 0, 0, 0.6)",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						zIndex: 1000,
					}}
				>
					<div
						style={{
							backgroundColor: "#fff",
							padding: "2rem",
							borderRadius: "10px",
							boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
							textAlign: "center",
						}}
					>
						<h2 style={{ marginBottom: "1rem" }}>Missing Dataset</h2>
						<p>
							You need to upload <code>campus.zip</code> before using the app.
						</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default MainLayout;
