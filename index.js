import axios from "axios";

const url = "https://it-helpdesk.itb.ac.id/api/v3/requests";
const queryParams = encodeURIComponent(`{
  "list_info": {
    "start_index": 1,
    "sort_field": "requester.name",
    "filter_by": {
      "id": "30"
    },
    "sort_order": "asc",
    "row_count": "25",
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

axios
	.get(fullUrl, {
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
				"_gid=GA1.3.1473376994.1706082527; _ga_T9ZME3XCCM=GS1.1.1706082526.1.1.1706083086.50.0.0; _ga=GA1.1.739500913.1706082526; _ga_FZR0YZY0W6=GS1.1.1706082526.1.1.1706083086.0.0.0; SDPSESSIONID=B8C6895321670E6D7FF59B24A93A5224; JSESSIONIDSSO=259B288F21D57401012BB8C523EA7026; PORTALID=1; sdpcsrfcookie=c23d3c10786c24ee5a8d595b85970e7e4d6c44f2b012e852e05bc72e6f12f29626d9c924c367021f2c9867bdf2a4934e8521e1b9f142d5d9223e9ccbf42d74d5; _zcsr_tmp=c23d3c10786c24ee5a8d595b85970e7e4d6c44f2b012e852e05bc72e6f12f29626d9c924c367021f2c9867bdf2a4934e8521e1b9f142d5d9223e9ccbf42d74d5",
			Referer:
				"https://it-helpdesk.itb.ac.id/WOListView.do?viewID=30&globalViewName=Service_Requests",
			"Referrer-Policy": "strict-origin-when-cross-origin",
		},
	})
	.then((response) => {
		// console.log("Full API Response:", response.data);

		if (response.data && response.data.response_status) {
			const { status_code, messages, status } = response.data.response_status;

			if (status === "failed") {
				console.error(`Failed to fetch data. Status code: ${status_code}`);
				console.error("Error messages:", messages);
				return; // Stop fetching data on failure
			}
		}

		const allRequests = response.data.requests || [];
		// console.log("All Requests:", allRequests);

		if (allRequests.length > 0) {
			const requesterNames = allRequests.map(
				(request) => request.requester && request.requester.name
			);
			console.log("Requester Names:", requesterNames);
		} else {
			console.log("No requests found in the response.");
		}
	})
	.catch((error) => console.error("Error:", error.message));
