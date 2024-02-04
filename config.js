import mysql from "mysql2/promise";

const pool = mysql.createPool({
	host: "localhost",
	user: "root",
	password: "",
	database: "reporting_web",
	waitForConnections: true,
	connectionLimit: 10, // Set an appropriate limit
	queueLimit: 0,
});

const insertIntoDb = async (data) => {
	let connection;

	try {
		if (!data || !data.requests || !Array.isArray(data.requests)) {
			throw new Error("Invalid data format or missing requests array");
		}

		// Use a connection from the pool
		connection = await pool.getConnection();
		const queryAsync = connection.execute.bind(connection);

		// Begin a transaction
		await connection.beginTransaction();

		// Inside the for loop
		// Inside the for loop
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
	} catch (error) {
		// Inside the catch block of insertIntoDb
		console.error("Error inserting data into the database:", error.message);
		console.error("SQL Error Code:", error.code);
		console.error("SQL Error Number:", error.errno);
		console.error("SQL Error SQL State:", error.sqlState);

		// Rollback the transaction in case of an error
		if (connection) {
			await connection.rollback();
		}

		throw error; // Rethrow the error after rollback
	} finally {
		// Release the connection back to the pool
		if (connection) {
			connection.release();
		}
	}
};

export default insertIntoDb;
