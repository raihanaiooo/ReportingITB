import {
	fetchDataSDP,
	fetchedDataSDP,
	fetchAndInsertDataIfNeeded,
	checkData,
} from "./scraping/sdp.js";

// Lakukan pemanggilan fungsi yang diperlukan di sini
const SDP = async () => {
	try {
		console.log("Logging in...");
		console.log("Checking data...");
		await checkData();

		console.log("Fetching data from SDP...");
		await fetchDataSDP();
		console.log("Data from SDP fetched successfully.");

		console.log("Fetching additional data from SDP...");
		await fetchedDataSDP();
		console.log("Additional data from SDP fetched successfully.");

		console.log("Fetching and inserting data if needed...");
		await fetchAndInsertDataIfNeeded();
		console.log("Data fetched and inserted successfully.");

		console.log("All operations completed successfully.");
	} catch (error) {
		console.error("Error:", error.message);
	}
};

SDP();
