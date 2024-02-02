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

		// Iterate over requests and insert into the 'ticketing' table
		for (const { id, status } of data.requests) {
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
			const sql = "INSERT INTO ticketing (id_scrape, status_id) VALUES (?, ?)";
			const values = [id, statusId];
			const results = await queryAsync(sql, values);

			console.log(
				`Data with ID ${id} inserted into the database. Rows affected: ${results.affectedRows}`
			);
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
