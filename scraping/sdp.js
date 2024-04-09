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
	const uniqueCreatedTimes = new Set(); // Menyimpan created_time yang sudah diambil

	await loginIfCookieExpired(); // Periksa apakah cookie telah kadaluwarsa dan lakukan login ulang jika perlu
	const currentYear = new Date().getFullYear();

	const fetchPage = async (page, retry = 0, recordsFetched = 0) => {
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

			if (response.data && response.data.response_status) {
				const { status_code, type, message } = response.data.response_status;

				if (type === "failed" && status_code === 4001) {
					console.error(
						"URL blocked due to maximum access limit. Retrying after some time..."
					);
					await delay(300000); // Tunggu 5 menit sebelum mencoba lagi (300000 ms)
					return await fetchPage(page, retry + 1, recordsFetched);
				} else if (type === "failed") {
					console.error(`Failed to fetch data. Status code: ${status_code}`);
					messages.forEach((message, index) => {
						console.error(`Error message ${index + 1}:`, message);
					});
					console.error("Failed URL:", fullUrl);
					return [];
				}
			}

			const currentPageRequests = response.data.requests || [];

			// Filter hanya untuk request yang belum pernah diambil sebelumnya
			const uniqueRequests = currentPageRequests.filter(
				(request) => !allRequestIds.has(request.id)
			);

			// Tambahkan ID dari request yang baru diambil ke dalam set
			uniqueRequests.forEach((request) => {
				allRequestIds.add(request.id);
			});

			// Filter hanya request dengan created_time pada tahun ini
			const currentYearRequests = uniqueRequests.filter((request) => {
				const createdTimeDisplayValue = request.created_time?.display_value;
				if (createdTimeDisplayValue) {
					const createdTimeDate = new Date(createdTimeDisplayValue);
					return createdTimeDate.getFullYear() === currentYear;
				}
				return false;
			});

			// Filter hanya request yang created_time nya unik
			const uniqueCurrentYearRequests = currentYearRequests.filter(
				(request) => {
					const createdTimeDisplayValue = request.created_time?.display_value;
					if (
						createdTimeDisplayValue &&
						!uniqueCreatedTimes.has(createdTimeDisplayValue)
					) {
						uniqueCreatedTimes.add(createdTimeDisplayValue);
						return true;
					}
					return false;
				}
			);

			// Insert data ke dalam database
			await Promise.all(
				uniqueCurrentYearRequests.map(async (request) => {
					try {
						if (request.id && request.status && request.status.name) {
							const statusName = request.status.name;
							const createdTimeDisplayValue =
								request.created_time?.display_value;
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

			recordsFetched += uniqueCurrentYearRequests.length;

			if (recordsFetched >= 200) {
				console.log("50 records fetched. Pausing for 1 minute.");
				await delay(60000); // Pause for 1 minute
				recordsFetched = 0; // Reset records counter
			}

			if (currentPageRequests.length === 0) {
				return []; // No more pages to fetch, exit recursion
			}

			const nextPageRequests = await fetchPage(page + 1, 0, recordsFetched);
			await delay(1000); // Introduce a delay of 1 second between requests
			return uniqueCurrentYearRequests.concat(nextPageRequests);
		} catch (error) {
			console.error("Error:", error.message);

			if (error.response && error.response.status === 400) {
				console.error(
					"Request failed with status code 400. Retrying after some time..."
				);
				await delay(300000); // Tunggu 5 menit sebelum mencoba lagi (300000 ms)
				return await fetchPage(page, retry + 1, recordsFetched);
			}

			if (error.code === "ETIMEDOUT" && retry < MAX_RETRY) {
				console.log(`Retrying... (attempt ${retry + 1}/${MAX_RETRY})`);
				return await fetchPage(page, retry + 1, recordsFetched);
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

const fetchedDataSDP = async () => {
	const recordsPerIteration = 100;
	const fetchInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
	let lastPageFetched = 1; // Variable to keep track of the last page fetched

	while (true) {
		try {
			const allRequests = await fetchDataSDP(lastPageFetched); // Fetch data starting from the last fetched page

			if (allRequests.length === 0) {
				console.log("No more data to fetch. Exiting...");
				break; // Exit loop if there's no more data
			}

			lastPageFetched++; // Increment the last page fetched

			// Tampilkan pesan jika telah mencapai batas jumlah record per iterasi
			if (allRequests.length >= recordsPerIteration) {
				console.log(
					`Fetched ${recordsPerIteration} records. Pausing for 5 minutes.`
				);
				await delay(fetchInterval); // Pause for 5 minutes
			}
		} catch (error) {
			console.error("Error fetching data:", error.message);
		}
	}
};

export default fetchedDataSDP;
