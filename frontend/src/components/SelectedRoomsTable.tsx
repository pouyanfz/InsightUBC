/**
 * SelectedRoomsTable.tsx
 * -----------------------
 * Displays a table of selected rooms with their details.
 *
 * - Shows up to 5 selected rooms
 * - Allows user to remove rooms
 *
 * Used in: MainLayout.tsx
 */

const SelectedRoomsTable = ({
	selectedRooms,
	onRemove,
	datasetId,
}: {
	selectedRooms: any[];
	onRemove: (roomName: string) => void;
	datasetId: string;
}) => {
	if (selectedRooms.length === 0) return null;

	return (
		<div key={selectedRooms.length} className="fade-in">
			<div className="mt-4 card shadow rounded">
				<div className="card-body">
					<h6 className="card-title" style={{ fontWeight: "bold", color: "green" }}>
						Selected Rooms ({selectedRooms.length}/5)
					</h6>
					<div className="table-responsive">
						<table className="table table-hover table-striped text-center align-middle">
							<thead className="table-dark">
								<tr>
									<th>#</th>
									<th>Room Name</th>
									<th>Building Name</th>
									<th>Room Number</th>
									<th>Seats</th>
									<th>Type of Room</th>
									<th>Furniture</th>
									<th>Address</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{selectedRooms.map((room, index) => (
									<tr key={index}>
										<td>
											<strong>{index + 1}</strong>
										</td>
										<td>{room[`${datasetId}_name`]}</td>
										<td>{room[`${datasetId}_fullname`]}</td>
										<td>{room[`${datasetId}_number`]}</td>
										<td>{room[`${datasetId}_seats`]}</td>
										<td>{room[`${datasetId}_type`]}</td>
										<td>{room[`${datasetId}_furniture`]}</td>
										<td>{room[`${datasetId}_address`]}</td>
										<td>
											<button className="btn btn-sm btn-danger" onClick={() => onRemove(room[`${datasetId}_name`])}>
												Remove
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SelectedRoomsTable;
