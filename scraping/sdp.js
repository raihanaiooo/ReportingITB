import axios from "axios";
import Login from "../cookies.js";
import fs from "fs/promises";
import createDbPool from "../config.js";
import { insertSDP } from "../db/insert.js";

const url = "https://it-helpdesk.itb.ac.id/api/v3/requests";
const MAX_RETRY = 3;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let allRequestIds = new Set();
let uniqueCreatedTimes = new Set();
let lastFetchedId;
let lastFetchedTime;

const generateHeaders = (cookies) => {
	const cookieString = cookies
		.map((cookie) => `${cookie.name}=${cookie.value}`)
		.join("; ");

	return {
		accept: "application/json, text/javascript, */*; q=0.01",
		"accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
		apiclient: "sdp_web",
		"cache-control": "max-age=0",
		"content-type": "application/x-www-form-urlencoded; charset=utf-8",
		"if-modified-since": "Thu, 1 Jan 1970 00:00:00 GMT",
		"sec-ch-ua":
			'"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
		"sec-ch-ua-mobile": "?0",
		"sec-ch-ua-platform": '"Windows"',
		"sec-fetch-dest": "empty",
		"sec-fetch-mode": "cors",
		"sec-fetch-site": "same-origin",
		"x-requested-with": "XMLHttpRequest",
		cookie: cookieString,
	};
};

const checkData = async () => {
	try {
		console.log("Checking data...");
		const rowCount = await fetchCountFromDatabase();
		if (rowCount === 0) {
			console.log("Database is empty. Fetching data...");
			await fetchDataSDP();
		} else {
			console.log("Database is not empty. No need to fetch data.");
		}
	} catch (error) {
		console.error("Error in checkData:", error.message);
	}
};

const fetchCountFromDatabase = async () => {
	let connection;
	try {
		const pool = createDbPool();
		connection = await pool.getConnection();
		const [rows] = await connection.query(
			"SELECT COUNT(*) as count FROM ticketing"
		);
		const rowCount = rows[0].count;

		return rowCount;
	} catch (error) {
		throw new Error(
			"Gagal mengambil jumlah baris dari database: " + error.message
		);
	} finally {
		if (connection) connection.release();
	}
};

const fetchDataSDP = async () => {
	try {
		await Login();
		const today = new Date();
		let continueFetching = true;

		while (continueFetching) {
			const allRequests = await fetchPage(1);

			if (allRequests.length === 0) {
				console.log("No more data to fetch. Exiting...");
				break;
			}

			const hasFutureData = allRequests.some((request) => {
				const createdTimeDisplayValue = request.created_time?.display_value;
				if (createdTimeDisplayValue) {
					const createdTimeDate = new Date(createdTimeDisplayValue);
					return createdTimeDate >= today;
				}
				return false;
			});

			if (hasFutureData) {
				continueFetching = false;
				console.log("Reached today's date. Pausing until new data arrives...");
				await delay(600000); // Pause for 10 minutes
			} else {
				console.log("No data up to today's date. Continuing fetching...");
			}
		}

		console.log("Data insertion completed.");
	} catch (error) {
		console.error("Error:", error.message);
		if (error.response && error.response.data) {
			console.error("Server Error Response:", error.response.data);
		}
	}
};

const fetchPage = async (page, recordsFetched = 0) => {
	const row_count = 25;
	const start_index = (page - 1) * row_count;
	const currentYear = new Date().getFullYear();
	const queryParams = encodeURIComponent(
		JSON.stringify({
			list_info: {
				start_index: start_index,
				sort_field: "requester.name",
				filter_by: {
					id: "30",
				},
				sort_order: "asc",
				row_count: row_count,
				search_fields: {
					is_service_request: true,
				},
				fields_required: ["requester", "status", "created_time"],
				get_total_count: true,
			},
		})
	);

	const fullUrl = `${url}?input_data=${queryParams}&SUBREQUEST=XMLHTTP&_=1706083864691`;

	try {
		const cookiesData = await fs.readFile("./cookies.json");
		const cookies = JSON.parse(cookiesData);

		const response = await axios.get(fullUrl, {
			headers: {
				...generateHeaders(cookies), // Setel cookies ke header permintaan
				Referer: "https://it-helpdesk.itb.ac.id/WOListView.do",
				"Referrer-Policy": "strict-origin-when-cross-origin",
			},
		});
		if (response.status === 400) {
			console.error("Request failed with status code 400. Exiting...");
			return [];
		}

		const currentPageRequests = response.data.requests || [];

		if (!Array.isArray(currentPageRequests)) {
			console.error("Response data is not an array. Exiting...");
			return [];
		}

		const uniqueRequests = currentPageRequests.filter(
			(request) => !allRequestIds.has(request.id)
		);

		uniqueRequests.forEach((request) => {
			allRequestIds.add(request.id);
		});

		const currentYearRequests = uniqueRequests.filter((request) => {
			const createdTimeDisplayValue = request.created_time?.display_value;
			if (createdTimeDisplayValue) {
				const createdTimeDate = new Date(createdTimeDisplayValue);
				const currentYear = new Date().getFullYear();
				return (
					createdTimeDate.getFullYear() === currentYear &&
					!uniqueCreatedTimes[createdTimeDisplayValue]
				);
			}
			return false;
		});

		await Promise.all(
			currentYearRequests.map(async (request) => {
				try {
					if (request.id && request.status && request.status.name) {
						const statusName = request.status.name;
						const createdTimeDisplayValue = request.created_time?.display_value;
						await insertSDP({
							requests: [
								{
									id: request.id,
									status: statusName,
									createdTimeDisplayValue: createdTimeDisplayValue || null,
								},
							],
						});

						console.log(
							`Data with ID ${request.id} inserted into the database.`
						);
					} else {
						console.log(
							`Skipping request due to invalid id, status, or created_time.`
						);
						console.log("Request Data:", request);
					}
				} catch (error) {
					console.error(
						`Error inserting data with ID ${request.id}:`,
						error.message
					);
				}
			})
		);

		recordsFetched += currentYearRequests.length;

		if (recordsFetched >= 200) {
			console.log("50 records fetched. Pausing for 30 minute.");
			await delay(1800000);
			recordsFetched = 0;
		}

		if (currentPageRequests.length === 0) {
			return [];
		}

		const nextPageRequests = await fetchPage(page + 1, recordsFetched);
		await delay(600000);
		return currentYearRequests.concat(nextPageRequests);
	} catch (error) {
		console.error("Error:", error.message);
		return [];
	}
};

const fetchedDataSDP = async (lastPageFetched = 1) => {
	const recordsPerIteration = 100;
	const fetchInterval = 30 * 60 * 1000;

	while (true) {
		try {
			const allRequests = await fetchPage(lastPageFetched);
			if (allRequests.length === 0) {
				console.log("No more data to fetch. Exiting...");
				break;
			}

			lastPageFetched++;
			if (allRequests.length >= recordsPerIteration) {
				console.log(
					`Mengambil ${recordsPerIteration} rekord. Menunggu 30 menit.`
				);
				await delay(fetchInterval);
			}
		} catch (error) {
			console.error("Error fetching data:", error.message);
		}
	}
};

const fetchAndInsertDataIfNeeded = async () => {
	try {
		// Fetch data
		let allRequests = await fetchPage(1);

		// If no data fetched, exit
		if (allRequests.length === 0) {
			console.log("No more data to fetch. Exiting...");
			return;
		}

		// Sort fetched data by created time
		allRequests.sort(
			(a, b) =>
				new Date(a.created_time.display_value) -
				new Date(b.created_time.display_value)
		);

		// Determine last fetched data from database
		const getLastFetchedDataFromDB = async () => {
			// Implement logic to get last fetched data from DB
			// For example:
			return {
				id_scrape: lastFetchedId,
				created_time: lastFetchedTime,
			};
		};

		// Get last fetched data from DB
		const lastFetchedDB = await getLastFetchedDataFromDB();

		// If there is new data to insert
		if (
			lastFetchedDB &&
			allRequests.length > 0 &&
			allRequests[0].created_time.display_value !== lastFetchedDB.created_time
		) {
			// Process and insert new data
			const itemsToInsert = allRequests.filter(
				(request) =>
					new Date(request.created_time.display_value) >
					new Date(lastFetchedDB.created_time)
			);

			// Insert each item to DB
			await Promise.all(
				itemsToInsert.map(async (item) => {
					try {
						await insertSDP({
							requests: [
								{
									id: item.id,
									status: item.status.name,
									createdTimeDisplayValue:
										item.created_time.display_value || null,
								},
							],
						});
						console.log(`Data with ID ${item.id} inserted into the database.`);
					} catch (error) {
						console.error(
							`Error inserting data with ID ${item.id}:`,
							error.message
						);
					}
				})
			);

			// Update last fetched data in DB
			lastFetchedId = itemsToInsert[itemsToInsert.length - 1].id;
			lastFetchedTime =
				itemsToInsert[itemsToInsert.length - 1].created_time.display_value;

			console.log("Data insertion completed.");
		} else {
			console.log("No new data to insert.");
		}
	} catch (error) {
		console.error("Error fetching and inserting data:", error.message);
	}
};
// Initial call to fetch data from SDP
await fetchDataSDP();

// Set interval to fetch and insert data
setInterval(fetchAndInsertDataIfNeeded, fetchInterval);
export {
	fetchDataSDP,
	fetchedDataSDP,
	fetchPage,
	fetchAndInsertDataIfNeeded,
	checkData,
};
