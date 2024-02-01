import axios from "axios";
import insertIntoDb from "./config.js";

const url = "https://it-helpdesk.itb.ac.id/api/v3/requests";
const MAX_RETRY = 3;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchData = async () => {
	const allRequestIds = new Set(); // Menyimpan ID setiap request yang sudah diambil

	const fetchPage = async (page, retry = 0) => {
		const row_count = 25;
		const start_index = (page - 1) * row_count;

		const queryParams = encodeURIComponent(`{
		"list_info": {
		  "start_index": ${start_index},
		  "sort_field": "requester.name",
		  "filter_by": {
			"id": "30"
		  },
		  "sort_order": "asc",
		  "row_count": "${row_count}",
		  "search_fields": {
			"is_service_request": true
		  },
		  "fields_required": [
			"requester"
		  ],
		  "get_total_count": true
		}
	  }`);

		const fullUrl = `${url}?input_data=${queryParams}&SUBREQUEST=XMLHTTP&_=1706083864691`;

		try {
			const response = await axios.get(fullUrl, {
				headers: {
					accept: "application/json, text/javascript, */*; q=0.01",
					"accept-language":
						"id-ID,id;q=0.9,ja-JP;q=0.8,ja;q=0.7,en-US;q=0.6,en;q=0.5",
					apiclient: "sdp_web",
					"cache-control": "max-age=0",
					"content-type": "application/x-www-form-urlencoded; charset=utf-8",
					"if-modified-since": "Thu, 1 Jan 1970 00:00:00 GMT",
					"sec-ch-ua":
						'"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
					"sec-ch-ua-mobile": "?0",
					"sec-ch-ua-platform": '"Windows"',
					"sec-fetch-dest": "empty",
					"sec-fetch-mode": "cors",
					"sec-fetch-site": "same-origin",
					"x-requested-with": "XMLHttpRequest",
					cookie:
						"_gid=GA1.3.421784375.1706749856; _ga=GA1.1.739500913.1706082526; _ga_T9ZME3XCCM=GS1.1.1706763419.5.0.1706763419.60.0.0; _ga_FZR0YZY0W6=GS1.1.1706763419.5.0.1706763419.0.0.0; SDPSESSIONID=E62899ECE605274A671113E6E2233B0E; JSESSIONIDSSO=0FEE61B9B696F1A4E4FB2375DEEDC1F5; PORTALID=1; sdpcsrfcookie=dfc5027b7552b885f1a0b7282ada506e8795f233082e5860d09489d05d921fca299709e8d780b247b0e928d372f1e6c1bc139a404ee0f66ea36636555406e0bf; _zcsr_tmp=dfc5027b7552b885f1a0b7282ada506e8795f233082e5860d09489d05d921fca299709e8d780b247b0e928d372f1e6c1bc139a404ee0f66ea36636555406e0bf",
					Referer:
						"https://it-helpdesk.itb.ac.id/WOListView.do?viewID=30&globalViewName=Service_Requests",
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
			await Promise.all(
				currentPageRequests.map(async (request) => {
					try {
						await insertIntoDb({ requests: [{ id: request.id }] });

						console.log(
							`Data with ID ${request.id} inserted into the database.`
						);
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
		const allRequests = await fetchPage(1);

		// Use Promise.all to concurrently insert data into the database
		await Promise.all(
			allRequests.map(async (request) => {
				try {
					await insertIntoDb({ id: request.id });
					console.log(`Data with ID ${request.id} inserted into the database.`);
				} catch (error) {
					console.error(
						`Error inserting data with ID ${request.id}:`,
						error.message
					);
				}
			})
		);

		for (const request of allRequests) {
			try {
				await insertIntoDb({ id: request.id });
			} catch (error) {
				console.error(
					`Error inserting data with ID ${request.id} into the database:`,
					error.message
				);
			}
		}

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
};

// Panggil fungsi untuk mengambil data
fetchData();
