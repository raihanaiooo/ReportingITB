import axios from "axios";

const url = "https://it-helpdesk.itb.ac.id/api/v3/requests";
const allRequestIds = new Set(); // Menyimpan ID setiap request yang sudah diambil
const MAX_RETRY = 3;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
					'"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"Windows"',
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				"x-requested-with": "XMLHttpRequest",
				cookie:
					"_ga=GA1.1.739500913.1706082526; _ga_T9ZME3XCCM=GS1.1.1706085642.2.0.1706085642.60.0.0; _ga_FZR0YZY0W6=GS1.1.1706085642.2.0.1706085642.0.0.0; SDPSESSIONID=7E60C9C6BA53F0BD5E58FA92FA279C36; JSESSIONIDSSO=9FE70B08D48CEDF15EF6B510F277ACEE; PORTALID=1; sdpcsrfcookie=f6e0dc6e0d94f5e816a9773d28b071a5858725f7c6967e84ee2b86e91cd220a02f3dfd2dff84cd1f820610a1c1405f901b82be0371af560d0a8de5f6062d0aae; _zcsr_tmp=f6e0dc6e0d94f5e816a9773d28b071a5858725f7c6967e84ee2b86e91cd220a02f3dfd2dff84cd1f820610a1c1405f901b82be0371af560d0a8de5f6062d0aae",
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

const fetchData = async () => {
	try {
		const allRequests = await fetchPage(1);
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
