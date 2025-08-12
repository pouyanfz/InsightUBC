/**
 * RoomCapacityChart.tsx
 * ----------------------
 * Shows room capacity as a chart.
 *
 * - Displays a pie chart for selected rooms
 * - Displays a bar chart for all rooms
 * - Toggles chart view based on selected rooms
 *
 * Used in: MainLayout.tsx
 */

import React, { useEffect, useState } from "react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip as RechartsTooltip,
	Legend as RechartsLegend,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";

interface Room {
	[key: string]: any;
}

interface Props {
	selectedRooms: Room[];
	allRooms: Room[];
	datasetId: string;
}

const COLORS = ["#0d6efd", "#6410f2", "#20c997", "#ffc107", "#dc3545"];

const RoomCapacityChart: React.FC<Props> = ({ selectedRooms, allRooms, datasetId }) => {
	const [viewMode, setViewMode] = useState<"selected" | "all">("all");
	useEffect(() => {
		if (selectedRooms.length > 0) {
			setViewMode("selected");
		}
	}, [selectedRooms]);

	const isSelectedAvailable = selectedRooms.length > 0;

	const roomsToDisplay = viewMode === "selected" && isSelectedAvailable ? selectedRooms : allRooms;
	const effectiveViewMode = isSelectedAvailable ? viewMode : "all";
	const seatKey = `${datasetId}_seats`;
	const nameKey = `${datasetId}_name`;

	return (
		<div className="card shadow mt-4 fade-in">
			<div className="card-body">
				<div className="d-flex justify-content-between align-items-center mb-3">
					<h5 className="card-title m-0">Room Capacity Chart</h5>
					<div>
						<div className="form-check form-check-inline">
							<input
								className="form-check-input"
								type="radio"
								name="viewMode"
								id="selectedRooms"
								value="selected"
								checked={viewMode === "selected"}
								onChange={(e) => setViewMode(e.target.value as "selected" | "all")}
								disabled={!isSelectedAvailable}
							/>
							<label className="form-check-label" htmlFor="selectedRooms">
								Selected Rooms (Pie)
							</label>
						</div>
						<div className="form-check form-check-inline">
							<input
								className="form-check-input"
								type="radio"
								name="viewMode"
								id="allRooms"
								value="all"
								checked={viewMode === "all" || !isSelectedAvailable}
								onChange={(e) => setViewMode(e.target.value as "selected" | "all")}
							/>
							<label className="form-check-label" htmlFor="allRooms">
								All Rooms (Bar)
							</label>
						</div>
					</div>
				</div>

				<ResponsiveContainer width="100%" height={300}>
					{effectiveViewMode === "selected" ? (
						<PieChart>
							<Pie
								data={roomsToDisplay}
								dataKey={seatKey}
								nameKey={nameKey}
								cx="50%"
								cy="50%"
								outerRadius={100}
								fill="#8884d8"
								label
							>
								{roomsToDisplay.map((_, index) => (
									<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
								))}
							</Pie>
							<RechartsTooltip />
							<RechartsLegend />
						</PieChart>
					) : (
						<BarChart data={roomsToDisplay}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey={nameKey} tick={false} />
							<YAxis />
							<RechartsTooltip
								formatter={(value) => [`${value}`, "Seats"]}
								labelFormatter={(label) => `Room: ${label}`}
							/>
							<Bar dataKey={seatKey} fill="#4677ab" />
						</BarChart>
					)}
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default RoomCapacityChart;
