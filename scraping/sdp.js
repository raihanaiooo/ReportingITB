import axios from "axios";
import Login from "../cookies.js";
import fs from "fs/promises";
import { insertSDP } from "../db/insert.js";

const url = "https://it-helpdesk.itb.ac.id/api/v3/requests";
const MAX_RETRY = 3;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let allRequestIds = new Set(); // Menyimpan ID setiap request yang sudah diambil
let uniqueCreatedTimes = new Set(); // Menyimpan created_time yang sudah diambil

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

// Fungsi untuk fetch data dari API SDP
const fetchDataSDP = async () => {
	try {
		await loginIfCookieExpired(); // Periksa apakah cookie telah kadaluwarsa dan lakukan login ulang jika perlu

		const currentYear = new Date().getFullYear();
		const today = new Date(); // Tanggal hari ini

		let continueFetching = true; // Variable untuk menentukan apakah perlu melanjutkan fetching atau tidak
		let lastFetchedDate = new Date(0); // Tanggal terakhir yang telah diambil, diinisialisasi ke tanggal awal

		const fetchPage = async (page, recordsFetched = 0) => {
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
					return []; // Keluar dari fungsi dan mengembalikan array kosong
				}

				const currentPageRequests = response.data.requests || [];

				if (!Array.isArray(currentPageRequests)) {
					console.error("Response data is not an array. Exiting...");
					return []; // Keluar dari fungsi dan mengembalikan array kosong
				}

				// Filter hanya untuk request yang belum pernah diambil sebelumnya
				const uniqueRequests = currentPageRequests.filter(
					(request) => !allRequestIds.has(request.id)
				);

				// Tambahkan ID dari request yang baru diambil ke dalam set
				uniqueRequests.forEach((request) => {
					allRequestIds.add(request.id);
				});

				// Filter hanya request dengan created_time pada tahun ini dan yang belum pernah diambil
				const currentYearRequests = uniqueRequests.filter((request) => {
					const createdTimeDisplayValue = request.created_time?.display_value;
					if (createdTimeDisplayValue) {
						const createdTimeDate = new Date(createdTimeDisplayValue);
						return (
							createdTimeDate.getFullYear() === currentYear &&
							!uniqueCreatedTimes.has(createdTimeDisplayValue)
						);
					}
					return false;
				});

				// Insert data ke dalam database
				await Promise.all(
					currentYearRequests.map(async (request) => {
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

				recordsFetched += currentYearRequests.length;

				if (recordsFetched >= 200) {
					console.log("50 records fetched. Pausing for 1 minute.");
					await delay(60000); // Pause for 1 minute
					recordsFetched = 0; // Reset records counter
				}

				if (currentPageRequests.length === 0) {
					return []; // No more pages to fetch, exit recursion
				}

				const nextPageRequests = await fetchPage(page + 1, recordsFetched);
				await delay(1000); // Introduce a delay of 1 second between requests
				return currentYearRequests.concat(nextPageRequests);
			} catch (error) {
				console.error("Error:", error.message);
				return [];
			}
		};

		while (continueFetching) {
			// Panggil fetchPage untuk mengambil data
			const allRequests = await fetchPage(1);

			if (allRequests.length === 0) {
				console.log("No more data to fetch. Exiting...");
				break; // Exit loop if there's no more data
			}

			// Update continueFetching berdasarkan kondisi yang sesuai
			continueFetching = !hasFutureData;

			// Cek apakah ada data yang tanggalnya lebih dari atau sama dengan tanggal hari ini
			const hasFutureData = allRequests.some((request) => {
				const createdTimeDisplayValue = request.created_time?.display_value;
				if (createdTimeDisplayValue) {
					const createdTimeDate = new Date(createdTimeDisplayValue);
					return createdTimeDate >= today;
				}
				return false;
			});

			if (hasFutureData) {
				continueFetching = false; // Jika ada data dengan tanggal lebih dari atau sama dengan tanggal hari ini, berhenti fetching
				console.log("Reached today's date. Pausing until new data arrives...");
			} else {
				console.log("No data up to today's date. Continuing fetching...");
			}

			// Update tanggal terakhir yang diambil
			if (allRequests.length > 0) {
				const lastRequestDate =
					allRequests[allRequests.length - 1].created_time.display_value;
				lastFetchedDate = new Date(lastRequestDate);
			}
		}

		// Melanjutkan fetching data secara berkala jika diperlukan
		setInterval(async () => {
			if (!continueFetching) {
				console.log("Resuming fetching...");
				await fetchedDataSDP(lastFetchedDate); // Memanggil kembali fungsi fetchedDataSDP untuk melanjutkan fetching dengan tanggal terakhir yang telah diambil sebelumnya
			}
		}, 300000);

		// Tampilkan pesan jika proses selesai
		console.log("Data insertion completed.");
	} catch (error) {
		console.error("Error:", error.message);
		if (error.response && error.response.data) {
			console.error("Server Error Response:", error.response.data);
		}
	}
};

// Fungsi untuk melanjutkan fetching data secara berkala jika diperlukan
const fetchedDataSDP = async (lastPageFetched = 1) => {
	const recordsPerIteration = 100;
	const fetchInterval = 5 * 60 * 1000; // 5 minutes in milliseconds

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
