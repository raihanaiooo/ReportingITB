import axios from "axios";
import { insertMinitab } from "../db/insert.js";
import fs from "fs/promises";
import createDbPool from "../config.js";

const pool = createDbPool();

const apiUrl =
	"https://licensing.minitab.com/api/v1/subscriptions/8b127d5f3f48492cbed3ac291a9e2533/products/e68147de1c46451bafadcfcc44e196cc/users?q=";

const checkCookieExpiration = async (cookies) => {
	const now = Date.now();
	for (const cookie of cookies) {
		if (cookie.expires && cookie.expires * 1000 < now) {
			return true;
		}
	}
	return false;
};

const loginIfCookieExpired = async () => {
	try {
		const cookiesData = await fs.readFile("./minitab.json");
		const cookies = JSON.parse(cookiesData);

		if (await checkCookieExpiration(cookies)) {
			console.log("Cookies have expired. Logging in again...");
			await Login(); // Lakukan login ulang
		} else {
			console.log("Cookies are still valid. Skipping login.");
		}
	} catch (error) {
		console.error("Error during login check:", error);
	}
};

const fetchDataMinitab = async () => {
	let db;
	try {
		db = await pool.getConnection();

		const requestBody = {
			list_info: {
				get_total_count: true,
			},
			Users: [],
			Total: 0,
			NextToken: "25",
		};

		await loginIfCookieExpired();
		const cookiesData = await fs.readFile("./minitab.json");
		const cookies = JSON.parse(cookiesData);
		const bodyString = JSON.stringify(requestBody);
		const response = await axios.get(apiUrl, {
			headers: {
				data: bodyString,
				...generateHeaders(cookies),
				Referer:
					"https://licensing.minitab.com/?manage=1&sub=8b127d5f3f48492cbed3ac291a9e2533&prod=e68147de1c46451bafadcfcc44e196cc",
				"Referrer-Policy": "strict-origin-when-cross-origin",
			},
		});

		const totalUsers = response.data.Total;

		if (typeof totalUsers !== "number") {
			throw new Error("Invalid data format or missing Total property");
		}

		await insertMinitab(db, { Total: totalUsers });

		console.log("Data berhasil dimasukkan ke dalam database.");
	} catch (error) {
		console.error("Error during request:", error.message);
		if (error.response && error.response.data) {
			console.error("Server Error Response:", error.response.data);
		}
	} finally {
		if (db) {
			db.release();
		}
	}
};

const generateHeaders = (cookies) => {
	const cookieString = cookies
		.map((cookie) => `${cookie.name}=${cookie.value}`)
		.join("; ");

	return {
		accept: "application/json, text/javascript, */*; q=0.01",
		"accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
		"content-type": "application/json;charset=utf-8",
		"portal-issuingauthority": "111111",
		"request-id": "|7498241b2333454f88a80870ead3fdd4.6a24681e81794b4b",
		"sec-ch-ua":
			'"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
		"sec-ch-ua-mobile": "?0",
		"sec-ch-ua-platform": '"Windows"',
		"sec-fetch-dest": "empty",
		"sec-fetch-mode": "cors",
		"sec-fetch-site": "same-origin",
		traceparent: "00-7498241b2333454f88a80870ead3fdd4-6a24681e81794b4b-01",
		"x-requested-with": "XMLHttpRequest",
		cookie: cookieString,
	};
};

export default fetchDataMinitab;
