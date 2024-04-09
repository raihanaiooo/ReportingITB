import schedule from "node-schedule";
import fetchedDataSDP from "./scraping/sdp.js"; // Adjust the path accordingly

let newDataFetched = true; // Flag to indicate whether new data was fetched

// Schedule the fetchDataSDP function to run every 5 minutes
const job = schedule.scheduleJob("*/1 * * * *", async () => {
	console.log("Running data fetching job...");
	if (newDataFetched) {
		await fetchedDataSDP();
		newDataFetched = false; // Reset the flag after fetching data
	} else {
		console.log("No new data fetched. Stopping further fetching.");
		job.cancel(); // Stop further execution of the job
	}
});

// Log a message when the job is scheduled
console.log("Data fetching job scheduled to run every 1 minute.");
