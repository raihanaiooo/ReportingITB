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

	return pool;
};

export default createDbPool;
