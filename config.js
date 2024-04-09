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

	// Menambahkan event handler untuk menutup koneksi setiap kali koneksi diambil dari pool
	pool.on("acquire", (connection) => {
		console.log("Connection %d acquired", connection.threadId);
	});

	// Menambahkan event handler untuk menutup koneksi setiap kali koneksi dikembalikan ke pool
	pool.on("release", (connection) => {
		console.log("Connection %d released", connection.threadId);
		connection.destroy(); // Menutup koneksi secara eksplisit
	});

	return pool;
};

export default createDbPool;
