import axios from "axios";
import { insertSDP } from "../db/insert.js";

const url = "https://it-helpdesk.itb.ac.id/api/v3/requests";
const MAX_RETRY = 3;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchDataSDP = async () => {
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
                    "requester", "status", "created_time"
                ],
                "get_total_count": true
            }
        }`);

		const fullUrl = `${url}?input_data=${queryParams}&SUBREQUEST=XMLHTTP&_=1706083864691`;

		try {
			const response = await axios.get(fullUrl, {
				headers: {
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
					cookie:
						"_ga_4P5NRFBN8P=GS1.3.1709016988.1.0.1709016988.0.0.0; _ga=GA1.1.739500913.1706082526; _ga_T9ZME3XCCM=GS1.1.1710300768.11.1.1710300808.20.0.0; _ga_FZR0YZY0W6=GS1.1.1710300768.11.1.1710300808.0.0.0; SDPSESSIONID=9725E57EA6ACDFE6BB4C03F67CCC68FA; JSESSIONIDSSO=1E8CBC3823C55BF1830955AD96054946; PORTALID=1; sdpcsrfcookie=ba33c1519955ac4a9883c1420fa78aaaffebb65cc2c97b112578a4b940def9fb0462fd093a76b6ee73b3e2be3d3663bcc3cef0c20eb4f0affcafd14deef01b76; _zcsr_tmp=ba33c1519955ac4a9883c1420fa78aaaffebb65cc2c97b112578a4b940def9fb0462fd093a76b6ee73b3e2be3d3663bcc3cef0c20eb4f0affcafd14deef01b76",
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
			await Promise.all(
				currentPageRequests.map(async (request) => {
					try {
						// Check if 'status' and 'id' are defined
						if (request.status && request.status.name && request.id) {
							const statusName = request.status.name;

							// Check if the status is one of the allowed statuses
							if (allowedStatuses.includes(statusName)) {
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

	return fetchDataSDP;
};

export default fetchDataSDP;
