/**
 * BuildingRoomSelector.tsx
 * -------------------------
 * Lets users pick a building and select up to 5 rooms.
 *
 * - Filters rooms by seats and furniture
 * - Shows rooms in the selected building
 * - Sends selected rooms and highlighted building to parent
 *
 * Used in: MainLayout.tsx
 */

import React, { useEffect, useState } from "react";
import Select from "react-select";
import RoomDetail from "./RoomDetail";

interface BuildingRoomSelectorProps {
	selectedRooms: any[];
	setSelectedRooms: React.Dispatch<React.SetStateAction<any[]>>;
	setAllRooms: React.Dispatch<React.SetStateAction<any[]>>;
	setHighlightedBuilding: React.Dispatch<React.SetStateAction<string | null>>;
	datasetId: string;
}

const BuildingRoomSelector: React.FC<BuildingRoomSelectorProps> = ({
	selectedRooms,
	setSelectedRooms,
	setAllRooms,
	setHighlightedBuilding,
	datasetId,
}) => {
	const [buildings, setBuildings] = useState<any[]>([]);
	const [rooms, setRooms] = useState<any[]>([]);
	const [minSeats, setMinSeats] = useState<number>(0);
	const [furnitureTypes, setFurnitureTypes] = useState<string[]>([]);
	const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
	const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
	const [showAlert, setMaximumRoomAlert] = useState(false);
	const [allFetchedRooms, setAllFetchedRooms] = useState<any[]>([]);

	// This useEffect is created with the help of Generative AI
	useEffect(() => {
		if (!datasetId) return;
		const fetchAllFilteredRooms = async () => {
			const filters: any[] = [];

			if (minSeats > 0) {
				filters.push({ GT: { [`${datasetId}_seats`]: minSeats } });
			}
			if (furnitureTypes.length > 0) {
				filters.push({
					OR: furnitureTypes.map((f) => ({
						IS: { [`${datasetId}_furniture`]: f },
					})),
				});
			}

			const query = {
				WHERE: filters.length === 0 ? {} : { AND: filters },
				OPTIONS: {
					COLUMNS: [
						`${datasetId}_name`,
						`${datasetId}_shortname`,
						`${datasetId}_fullname`,
						`${datasetId}_number`,
						`${datasetId}_seats`,
						`${datasetId}_type`,
						`${datasetId}_address`,
						`${datasetId}_furniture`,
						`${datasetId}_lat`,
						`${datasetId}_lon`,
					],
					ORDER: `${datasetId}_name`,
				},
			};

			try {
				const res = await fetch("http://localhost:4321/query", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(query),
				});
				const data = await res.json();
				setAllRooms(data.result);
				setAllFetchedRooms(data.result);

				const uniqueBuildings = Array.from(
					new Map(data.result.map((b: any) => [b[`${datasetId}_shortname`], b])).values()
				);
				setBuildings(uniqueBuildings);

				if (selectedBuilding) {
					const filteredRooms = data.result.filter((r: any) => r[`${datasetId}_shortname`] === selectedBuilding);
					setRooms(filteredRooms);
				}
			} catch (err) {
				console.error("Failed to fetch all filtered rooms", err);
			}
		};

		fetchAllFilteredRooms();
	}, [minSeats, furnitureTypes, selectedBuilding, setAllRooms, datasetId]);

	useEffect(() => {
		if (selectedRooms.length < 5 && showAlert) {
			setMaximumRoomAlert(false);
		}
	}, [selectedRooms, showAlert]);

	const toggleRoomSelection = (room: any) => {
		const exists = selectedRooms.find((r) => r[`${datasetId}_name`] === room[`${datasetId}_name`]);
		if (exists) {
			setSelectedRooms(selectedRooms.filter((r) => r[`${datasetId}_name`] !== room[`${datasetId}_name`]));
		} else if (selectedRooms.length < 5) {
			setSelectedRooms([...selectedRooms, room]);
			setMaximumRoomAlert(false);
		} else {
			setMaximumRoomAlert(true);
		}
	};

	return (
		<div style={{ width: "500px", margin: "1rem auto", textAlign: "left" }}>
			<h3 style={{ fontWeight: "bold" }}>Building and Room Selector</h3>
			<p>Select a building to view its rooms and capacities.</p>
			<div
				className="card mb-3 shadow rounded4 fade-in bg-warning-subtle"
				style={{ position: "relative", zIndex: 1, overflow: "visible" }}
			>
				<div className="card-body">
					<h5 className="card-title" style={{ fontWeight: "bold", textAlign: "center" }}>
						Filters
					</h5>
					<div className="mb-3">
						<label htmlFor="minSeats" className="form-label">
							Minimum Seats
						</label>
						<input
							type="number"
							id="minSeats"
							className="form-control"
							value={minSeats}
							onChange={(e) => setMinSeats(Number(e.target.value))}
						/>
					</div>

					<div className="mb-3">
						<label className="form-label">Furniture Types</label>
						<Select
							isMulti
							className="basic-multi-select"
							classNamePrefix="select"
							options={[
								{ value: "Classroom-Fixed Tables/Fixed Chairs", label: "Fixed Tables/Fixed Chairs" },
								{ value: "Classroom-Fixed Tables/Movable Chairs", label: "Fixed Tables/Movable Chairs" },
								{ value: "Classroom-Fixed Tables/Moveable Chairs", label: "Fixed Tables/Moveable Chairs" },
								{ value: "Classroom-Fixed Tablets", label: "Fixed Tablets" },
								{ value: "Classroom-Hybrid Furniture", label: "Hybrid Furniture" },
								{ value: "Classroom-Learn Lab", label: "Learn Lab" },
								{ value: "Classroom-Movable Tables & Chairs", label: "Movable Tables & Chairs" },
								{ value: "Classroom-Movable Tablets", label: "Movable Tablets" },
								{ value: "Classroom-Moveable Tables & Chairs", label: "Moveable Tables & Chairs" },
								{ value: "Classroom-Moveable Tablets", label: "Moveable Tablets" },
							]}
							onChange={(selectedOptions) => {
								setFurnitureTypes(selectedOptions.map((opt) => opt.value));
							}}
							placeholder="Select furniture types"
						/>
					</div>
				</div>
			</div>

			<label style={{ marginBottom: "0.5rem", display: "block", fontWeight: "bold" }}>Select Building:</label>
			<Select
				options={buildings.map((b) => ({
					value: b[`${datasetId}_shortname`],
					label: `${b[`${datasetId}_shortname`]} : ${b[`${datasetId}_fullname`]}`,
				}))}
				onChange={(selectedOption) => {
					if (selectedOption) {
						setSelectedBuilding(selectedOption.value);
						setHighlightedBuilding(selectedOption.value);
						const filtered = allFetchedRooms.filter((r) => r[`${datasetId}_shortname`] === selectedOption.value);
						setRooms(filtered);
						setSelectedRoom(null);
					}
				}}
				placeholder="Search and select a building"
				isSearchable
			/>

			<p style={{ marginTop: "1rem", fontWeight: "bold", color: "green" }}>
				Selected Rooms: {selectedRooms.length} / 5
			</p>
			{showAlert && (
				<div className="alert alert-danger mt-3 fade-in" role="alert">
					You can only select up to 5 rooms.
				</div>
			)}

			{rooms.length > 0 && (
				<div className="card shadow mt-3 fade-in" style={{ maxHeight: "12rem", overflowY: "auto" }}>
					<div className="card-body" style={{ padding: "0.5rem" }}>
						{rooms.map((room, i) => (
							<div
								key={i}
								style={{
									marginBottom: "0.5rem",
									cursor: "pointer",
									backgroundColor: selectedRoom === room ? "#eef" : "transparent",
									padding: "0.25rem",
									borderRadius: "4px",
								}}
								onClick={() => setSelectedRoom(room)}
							>
								{room[`${datasetId}_name`]} - Capacity: {room[`${datasetId}_seats`]}
							</div>
						))}
					</div>
				</div>
			)}

			<div className="fade-in">
				<RoomDetail
					room={selectedRoom}
					isSelected={
						selectedRoom != null &&
						selectedRooms.some((r) => r[`${datasetId}_name`] === selectedRoom[`${datasetId}_name`])
					}
					onToggleSelect={() => {
						if (selectedRoom) toggleRoomSelection(selectedRoom);
					}}
					datasetId={datasetId}
				/>
			</div>
		</div>
	);
};

export default BuildingRoomSelector;
