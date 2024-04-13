import axios from "axios";
import Login from "../cookies.js";
import fs from "fs/promises";
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
		const cookiesData = await fs.readFile("./cookies.json");
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

const checkData = async () => {
	try {
		const rowCount = await fetchCountFromDatabase();
		if (rowCount === 0) {
			console.log("Database is empty. Fetching data...");
			await fetchDataSDP();
		} else {
			console.log("Database is not empty. No need to fetch data.");
		}
	} catch (error) {
		console.error("Error checking row count:", error.message);
	}
};

const fetchDataSDP = async () => {
	try {
		await loginIfCookieExpired();
		const today = new Date();
		let continueFetching = true;
		let lastFetchedDate = new Date(0);

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

			continueFetching = !hasFutureData;

			if (hasFutureData) {
				continueFetching = false;
				console.log("Reached today's date. Pausing until new data arrives...");
			} else {
				console.log("No data up to today's date. Continuing fetching...");
			}

			if (allRequests.length > 0) {
				const lastRequest = allRequests[allRequests.length - 1];
				if (lastRequest.created_time) {
					lastFetchedTime = lastRequest.created_time.display_value;
				} else {
					console.error("Last request does not have a created_time property.");
				}
			} else {
				console.error("No requests fetched.");
			}
		}

		setInterval(async () => {
			if (!continueFetching) {
				console.log("Resuming fetching...");
				await fetchedDataSDP(lastFetchedDate);
			}
		}, 600000);
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
				...generateHeaders(cookies),
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
					`Mengambil ${recordsPerIteration} rekord. Menunggu 5 menit.`
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
		const allRequests = await fetchPage(1);

		allRequests.sort((a, b) => {
			return (
				new Date(a.created_time.display_value) -
				new Date(b.created_time.display_value)
			);
		});

		const getLastFetchedDataFromDB = async () => {
			return {
				id_scrape: lastFetchedId,
				created_time: lastFetchedTime,
			};
		};

		const lastFetched = allRequests[allRequests.length - 1];
		if (lastFetched && lastFetched.created_time) {
			const lastFetchedDB = await getLastFetchedDataFromDB();

			if (
				lastFetched.created_time.display_value !==
				lastFetchedDB.createdTimeDisplayValue
			) {
				const itemsToInsert = allRequests.slice(-200);

				console.log("Membuka koneksi database...");

				itemsToInsert.forEach(async (item) => {
					if (!uniqueCreatedTimes[item.created_time.display_value]) {
						try {
							await insertDataToDB(item);
							uniqueCreatedTimes[item.created_time.display_value] = true;
							console.log(
								`Data dengan ID ${item.id} dimasukkan ke dalam database.`
							);
						} catch (error) {
							console.error(
								`Error saat memasukkan data dengan ID ${item.id}:`,
								error.message
							);
						}
					} else {
						console.log(
							`Skipping request with ID ${item.id} due to duplicate created_time.`
						);
					}
				});

				console.log("Menutup koneksi database...");
			} else {
				console.log("Tidak ada data baru untuk diambil. Keluar...");
			}
		}
	} catch (error) {
		console.error("Error fetching and inserting data:", error.message);
	}
};

const fetchInterval = 30 * 60 * 1000;
setInterval(fetchAndInsertDataIfNeeded, fetchInterval);

export {
	fetchDataSDP,
	fetchedDataSDP,
	fetchPage,
	fetchAndInsertDataIfNeeded,
	checkData,
};
