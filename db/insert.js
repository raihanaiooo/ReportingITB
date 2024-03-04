import createDbPool from "../config.js";

const insertSDP = async (data) => {
	const pool = createDbPool();
	let connection;

	try {
		if (!data || !data.requests || !Array.isArray(data.requests)) {
			throw new Error("Invalid data format or missing requests array");
		}

		connection = await pool.getConnection();
		const queryAsync = connection.execute.bind(connection);

		await connection.beginTransaction();

		for (const requestData of data.requests) {
			const { id, status, createdTimeDisplayValue } = requestData;

			try {
				if (id === undefined || status === undefined) {
					console.error(
						"Invalid data. ID or status is undefined.",
						requestData
					);
					continue;
				}

				console.log("Attempting to insert data:", {
					id,
					status,
					createdTimeDisplayValue,
				});

				// Fetch the corresponding status_id from the 'status' table based on the 'status' name
				const statusResult = await queryAsync(
					"SELECT id FROM status WHERE name = ?",
					[status]
				);

				if (statusResult[0].length === 0) {
					console.log(`Status '${status}' not found in the database.`);
					continue;
				}

				const statusId = statusResult[0][0].id;

				// Insert into the 'ticketing' table with the corresponding status_id
				const sql =
					"INSERT INTO ticketing (id_scrape, created_time, status_id) VALUES (?, ?, ?)";

				// Set createdTimeDisplayValue to null if it's undefined
				const values = [
					id,
					createdTimeDisplayValue !== undefined
						? createdTimeDisplayValue
						: null,
					statusId,
				];

				const results = await queryAsync(sql, values);

				console.log(
					`Data with ID ${id} inserted into the database. Rows affected: ${results.affectedRows}`
				);
			} catch (error) {
				console.error(`Error inserting data with ID ${id}:`, error.message);
				console.error("SQL Error Code:", error.code);
				console.error("SQL Error Number:", error.errno);
				console.error("SQL Error SQL State:", error.sqlState);
			}
		}

		// Commit the transaction
		await connection.commit();

		console.log("Data inserted into the database successfully.");
	} catch (error) {
		console.error("Error inserting data into the database:", error.message);
		console.error("SQL Error Code:", error.code);
		console.error("SQL Error Number:", error.errno);
		console.error("SQL Error SQL State:", error.sqlState);

		if (connection) {
			await connection.rollback();
		}

		throw error;
	} finally {
		if (connection) {
			try {
				await connection.release();
			} catch (releaseError) {
				console.error("Error releasing connection:", releaseError.message);
			}
		}
	}
};

const insertMinitab = async (db, data) => {
	const appTypeId = 5; // Set the desired app_type_id

	try {
		if (!data || !data.Total) {
			throw new Error("Invalid data format or missing Total property");
		}

		const { Total } = data;

		console.log("Attempting to insert or update data:", {
			Total,
			appTypeId,
		});

		// Check if a record with the given Total exists
		const checkQuery = "SELECT * FROM licenses WHERE total = ?";
		const checkResults = await db.query(checkQuery, [Total]);

		if (checkResults && checkResults.length > 0) {
			// Record with the given Total exists, update the 'used' column
			const updateQuery = "UPDATE licenses SET used = ? WHERE total = ?";
			const updateResults = await db.execute(updateQuery, [Total, Total]);

			console.log(
				`Data with Total ${Total} updated. Rows affected: ${updateResults.affectedRows}`
			);
		} else {
			// Record with the given Total doesn't exist, insert a new record
			const insertQuery =
				"INSERT INTO licenses (total, app_type_id, used, available) VALUES (?, ?, ?, ?)";
			const insertValues = [10060, appTypeId, Total, 10060 - Total];

			const insertResults = await db.execute(insertQuery, insertValues);

			console.log(
				`Data with Total ${Total} inserted into the database. Rows affected: ${insertResults.affectedRows}`
			);
		}
	} catch (error) {
		console.error("Error inserting or updating data:", error.message);
		console.error("SQL Error Code:", error.code);
		console.error("SQL Error Number:", error.errno);
		console.error("SQL Error SQL State:", error.sqlState);

		throw error;
	}
};

export { insertSDP, insertMinitab };
