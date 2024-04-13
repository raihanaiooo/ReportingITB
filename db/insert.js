import createDbPool from "../config.js";

// Atur struktur data tambahan untuk melacak createdTimeDisplayValue yang sudah ada
const existingCreatedTimeDisplayValues = new Set();

const insertSDP = async (data) => {
	const pool = createDbPool();
	let connection;

	try {
		if (!data || !data.requests || !Array.isArray(data.requests)) {
			throw new Error("Invalid data format or missing requests array");
		}

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

				connection = await pool.getConnection();
				const queryAsync = connection.execute.bind(connection);
				await connection.beginTransaction();

				console.log("Attempting to insert data:", {
					id,
					status,
					createdTimeDisplayValue,
				});

				// Periksa apakah data dengan created_time yang sama sudah ada dalam database
				const existingData = await queryAsync(
					"SELECT COUNT(*) AS count FROM ticketing WHERE created_time = ?",
					[createdTimeDisplayValue]
				);

				if (existingData[0][0].count > 0) {
					console.log(
						`Data dengan created_time ${createdTimeDisplayValue} sudah ada. Lewati penyisipan...`
					);
					continue;
				}

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
					"INSERT INTO ticketing (id_scrape, created_time, status_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())";

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

				// Commit the transaction
				await connection.commit();
			} catch (error) {
				console.error(`Error inserting data with ID ${id}:`, error.message);
				console.error("SQL Error Code:", error.code);
				console.error("SQL Error Number:", error.errno);
				console.error("SQL Error SQL State:", error.sqlState);

				if (connection) {
					await connection.rollback();
				}
			} finally {
				if (connection) {
					await connection.release();
				}
			}
		}

		console.log("Data insertion completed.");
	} catch (error) {
		console.error("Error inserting data into the database:", error.message);
		console.error("SQL Error Code:", error.code);
		console.error("SQL Error Number:", error.errno);
		console.error("SQL Error SQL State:", error.sqlState);
		throw error;
	}
};

const insertMinitab = async (db, data) => {
	const appTypeId = 5; // Set the desired app_type_id

	try {
		if (!data || !data.Total) {
			throw new Error("Invalid data format or missing Total property");
		}

		const { Total } = data;

		console.log("Attempting to insert data:", {
			Total,
			appTypeId,
		});

		// Define currentTimestamp
		const currentTimestamp = new Date()
			.toISOString()
			.slice(0, 19)
			.replace("T", " "); // Get current timestamp in 'YYYY-MM-DD HH:mm:ss' format

		const existingRecord = await db.query(
			"SELECT * FROM licenses WHERE app_type_id = ?",
			[appTypeId]
		);

		if (existingRecord.length > 0) {
			// If the record exists, insert a new record with the 'inserted_at' timestamp
			const insertSql =
				"INSERT INTO licenses (total, app_type_id, used, available, inserted_at) VALUES (?, ?, ?, ?, ?)";
			const insertValues = [
				10060,
				appTypeId,
				Total,
				10060 - Total,
				currentTimestamp,
			];

			const insertResults = await db.execute(insertSql, insertValues);

			console.log(
				`Data with Total ${Total} inserted into the database. Rows affected: ${insertResults.affectedRows}`
			);
		} else {
			// If the record does not exist, update the 'used', 'available', and 'inserted_at' columns
			const updateSql =
				"UPDATE licenses SET used = ?, available = ?, inserted_at = ? WHERE app_type_id = ?";
			const updateValues = [Total, 10060 - Total, currentTimestamp, appTypeId];

			const updateResults = await db.execute(updateSql, updateValues);

			console.log(
				`Data with Total ${Total} updated in the database. Rows affected: ${updateResults.affectedRows}`
			);
		}
	} catch (error) {
		console.error("Error inserting data:", error.message);
		console.error("SQL Error Code:", error.code);
		console.error("SQL Error Number:", error.errno);
		console.error("SQL Error SQL State:", error.sqlState);

		throw error;
	}
};

export { insertSDP, insertMinitab };
