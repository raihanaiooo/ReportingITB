import mysql from "mysql";
import { promisify } from "util";

const dbConfig = {
	host: "localhost",
	user: "root",
	password: "",
	database: "reporting_web",
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
	if (err) {
		console.error("Error connecting to MySQL:", err.message);
		return;
	}

	console.log("Connected to MySQL!");
});

const queryAsync = promisify(connection.query).bind(connection);

const insertIntoDb = async (data) => {
	try {
		// Use the promisified query function
		await queryAsync("SELECT 1");

		for (const request of data.requests) {
			const sql = "INSERT INTO ticketing (id_scrape) VALUES (?)";
			const values = [request.id];

			const results = await queryAsync(sql, values);

			console.log(
				`Data with ID ${request.id} inserted into the database. Rows affected: ${results.affectedRows}`
			);
		}
	} catch (error) {
		// Inside the catch block of insertIntoDb
		console.error("Error inserting data into the database:", error.message);
		console.error("SQL Error Code:", error.code);
		console.error("SQL Error Number:", error.errno);
		console.error("SQL Error SQL State:", error.sqlState);
	} finally {
		// Close the connection
		connection.end();
	}
};

export default insertIntoDb;
