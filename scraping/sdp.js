import axios from "axios";
import insertIntoDb from "../config.js";

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
			"requester", "status"
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
						"_ga=GA1.1.739500913.1706082526; _ga_T9ZME3XCCM=GS1.1.1706763419.5.0.1706763419.60.0.0; _ga_FZR0YZY0W6=GS1.1.1706763419.5.0.1706763419.0.0.0; SDPSESSIONID=0527EA8877C170A80EA7B80D3934ECF2; JSESSIONIDSSO=C9F277D90DD0546A7F725EC80A8DEF43; PORTALID=1; sdpcsrfcookie=fa29054907f96daef4d4ab6bb93372fbdb229865d3af3f0df792d4e084d7e1960bcf0f62b6a11697702ed53d99ab581bc2c846a606d1f9ee004fbc339381323b; _zcsr_tmp=fa29054907f96daef4d4ab6bb93372fbdb229865d3af3f0df792d4e084d7e1960bcf0f62b6a11697702ed53d99ab581bc2c846a606d1f9ee004fbc339381323b",
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

			// Specify the statuses you want to fetch
			const allowedStatuses = ["Open", "In Progress", "Closed", "Resolved"];

			await Promise.all(
				currentPageRequests.map(async (request) => {
					try {
						// Check if 'status' is defined and has the 'name' property
						if (request.status && request.status.name) {
							const statusName = request.status.name;

							// Check if the status is one of the allowed statuses
							if (allowedStatuses.includes(statusName)) {
								await insertIntoDb({
									requests: [{ id: request.id, status: statusName }],
								});

								console.log(
									`Data with ID ${request.id} inserted into the database.`
								);
							} else {
								console.log(
									`Skipping request with ID ${request.id} due to invalid status.`
								);
								console.log("Invalid Status Object:", request.status);
							}
						} else {
							console.log(
								`Skipping request with ID ${request.id} due to undefined or invalid status.`
							);
							console.log("Invalid Status Object:", request.status);
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
		const allRequests = await fetchPage(1);

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

	return fetchData;
};

export default fetchData;
