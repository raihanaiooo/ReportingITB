import mysql from "mysql2/promise";

const createDbPool = () => {
	const pool = mysql.createPool({
		host: "localhost",
		user: "root",
		password: "",
		database: "reporting_web",
		waitForConnections: true,
		connectionLimit: 20000,
		queueLimit: 0,
	});

	pool.on("acquire", (connection) => {
		console.log("Connection %d acquired", connection.threadId);
	});

	pool.on("release", (connection) => {
		console.log("Connection %d released", connection.threadId);
		connection.destroy();
	});

	return pool;
};

export default createDbPool; // Hapus tanda kurung () di sini
