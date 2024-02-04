import axios from "axios";

const MAX_RETRY = 3;

const fetchData = async (url, config) => {
	try {
		const response = await axios({
			method: "get",
			url,
			...config,
			retry: MAX_RETRY, // Number of retries
			retryDelay: (retryCount) => retryCount * 1000, // Delay between retries in milliseconds
		});

		// Handle successful response here
		return response.data;
	} catch (error) {
		// Handle other types of errors
		console.error("Request failed. Check the request data and parameters.");
		throw error;
	}
};

export default fetchData;
