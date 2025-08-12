/**
 * RoomDetail.tsx
 * ----------------
 * Shows detailed information for a selected room.
 *
 * - Displays building, room number, seats, type, furniture, and address
 * - Allows selecting or deselecting the room
 *
 * Used in: BuildingRoomSelector.tsx
 */

const RoomDetail = ({
	room,
	isSelected,
	onToggleSelect,
	datasetId,
}: {
	room: any;
	isSelected: boolean;
	onToggleSelect: () => void;
	datasetId: string;
}) => {
	const cardStyle = {
		minHeight: "350px",
	};

	if (!room) {
		return (
			<div className="card shadow rounded bg-secondary-subtle mt-3">
				<div className="card-body text-muted d-flex align-items-center justify-content-center" style={cardStyle}>
					<p className="m-0">
						<em>Select a room to see its details.</em>
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="fade-in">
			<div className="card shadow rounded bg-primary bg-opacity-10 mt-3">
				<div className="card-body" style={cardStyle}>
					<h4 className="card-title" style={{ fontWeight: "bold" }}>
						Room Details
					</h4>
					<p className="card-text">
						<strong>Building:</strong> {room[`${datasetId}_fullname`]} ({room[`${datasetId}_shortname`]})
					</p>
					<p className="card-text">
						<strong>Room:</strong> {room[`${datasetId}_name`]} (#{room[`${datasetId}_number`]})
					</p>
					<p className="card-text">
						<strong>Seats:</strong> {room[`${datasetId}_seats`]}
					</p>
					<p className="card-text">
						<strong>Type:</strong> {room[`${datasetId}_type`]}
					</p>
					<p className="card-text">
						<strong>Furniture:</strong> {room[`${datasetId}_furniture`]}
					</p>
					<p className="card-text">
						<strong>Address:</strong> {room[`${datasetId}_address`]}
					</p>

					<button className={`btn ${isSelected ? "btn-danger" : "btn-primary"} mt-2`} onClick={onToggleSelect}>
						{isSelected ? "Deselect Room" : "Select Room"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default RoomDetail;
