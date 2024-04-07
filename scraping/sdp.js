import axios from "axios";
import Login from "../cookies.js";
import fs from "fs/promises";
import { insertSDP } from "../db/insert.js";

const url = "https://it-helpdesk.itb.ac.id/api/v3/requests";
const MAX_RETRY = 3;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fungsi untuk memeriksa apakah cookie telah kedaluwarsa
const checkCookieExpiration = async (cookies) => {
	const now = Date.now();
	for (const cookie of cookies) {
		if (cookie.expires && cookie.expires * 1000 < now) {
			return true; // Cookie telah kedaluwarsa
		}
	}
	return false; // Semua cookie masih valid
};

// Fungsi untuk melakukan login ulang jika cookie telah kedaluwarsa
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

const fetchDataSDP = async () => {
	const allRequestIds = new Set(); // Menyimpan ID setiap request yang sudah diambil
	await loginIfCookieExpired(); // Periksa apakah cookie telah kadaluarsa dan lakukan login ulang jika perlu
	const currentYear = new Date().getFullYear();

	const fetchPage = async (page, retry = 0) => {
		const row_count = 25;
		const start_index = (page - 1) * row_count;

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
			// Baca cookies dari file cookies.json
			const cookiesData = await fs.readFile("./cookies.json");
			const cookies = JSON.parse(cookiesData);

			const response = await axios.get(fullUrl, {
				headers: {
					...generateHeaders(cookies),
					Referer: "https://it-helpdesk.itb.ac.id/WOListView.do",
					"Referrer-Policy": "strict-origin-when-cross-origin",
				},
			});

			console.log(`Successful response for page ${page}:`, response.data);

			if (response.data && response.data.response_status) {
				const { status_code, messages, status } = response.data.response_status;

				if (status === "failed") {
					console.error(`Failed to fetch data. Status code: ${status_code}`);
					messages.forEach((message, index) => {
						console.error(`Error message ${index + 1}:`, message);
					});

					// Log the request URL for debugging
					console.error("Failed URL:", fullUrl);

					return [];
				}
			}

			const currentPageRequests = response.data.requests || [];

			const uniqueRequests = currentPageRequests.filter(
				(request) => !allRequestIds.has(request.id)
			);
			currentPageRequests.forEach((request) => {
				allRequestIds.add(request.id);
			});

			// Specify the statuses you want to fetch
			const allowedStatuses = ["Open", "In Progress", "Closed", "Resolved"];
			// Fetch created_time for all requests first
			const createdTimes = currentPageRequests.map(
				(request) => request.created_time?.display_value
			);

			// Filter out undefined values and insert all created_times into the database
			await insertSDP({
				requests: createdTimes
					.filter((createdTime) => createdTime !== undefined)
					.map((createdTime) => ({ createdTime })),
			});

			// Insert only requests with created_time of the current year into the database
			await Promise.all(
				currentPageRequests.map(async (request) => {
					try {
						if (request.id && request.status && request.status.name) {
							const statusName = request.status.name;
							const createdTimeDisplayValue =
								request.created_time?.display_value;

							// Ubah created_time ke dalam objek Date
							const createdTimeDate = createdTimeDisplayValue
								? new Date(createdTimeDisplayValue)
								: null;

							if (
								createdTimeDate &&
								createdTimeDate.getFullYear() === currentYear
							) {
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
									`Skipping request with ID ${request.id} due to invalid or non-current year created_time.`
								);
							}
						} else {
							console.log(`Skipping request due to invalid id or status.`);
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

			const nextPageRequests = await fetchPage(page + 1);
			await delay(1000); // Introduce a delay of 1 second between requests
			return uniqueRequests.concat(nextPageRequests);
		} catch (error) {
			console.error("Error:", error.message);

			if (error.response && error.response.data) {
				console.error("Full Server Response:", error.response.data);

				const { messages } = error.response.data.response_status;
				if (messages) {
					messages.forEach((message, index) => {
						console.error(`Error message ${index + 1}:`, message);
					});
				}
			}

			if (error.code === "ETIMEDOUT" && retry < MAX_RETRY) {
				console.log(`Retrying... (attempt ${retry + 1}/${MAX_RETRY})`);
				return await fetchPage(page, retry + 1);
			}

			console.error("Request failed. Check the request data and parameters.");
			return [];
		}
	};

	try {
		// Panggil fetchPage untuk mengambil data
		const allRequests = await fetchPage(1);

		// Tampilkan hasil pengambilan data
		console.log("Data insertion completed.");
		const requesterNames = allRequests.map((request) => request.requester.name);
		console.log("Requester Names:", requesterNames);
		console.log("No more pages to fetch. Exiting...");
	} catch (error) {
		console.error("Error:", error.message);
		if (error.response && error.response.data) {
			console.error("Server Error Response:", error.response.data);
		}
	}

	return fetchDataSDP;
};

// Helper function to generate headers
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

export default fetchDataSDP;
