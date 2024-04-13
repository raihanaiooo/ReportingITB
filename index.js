import {
	fetchDataSDP,
	fetchedDataSDP,
	fetchPage,
	fetchAndInsertDataIfNeeded,
	checkData,
} from "./scraping/sdp.js";

// Lakukan pemanggilan fungsi yang diperlukan di sini
const fetchData = async () => {
	try {
		console.log("Checking data...");
		await checkData(); // Memanggil fungsi checkData untuk memeriksa keberadaan data

		console.log("Fetching data from SDP...");
		await fetchDataSDP(); // Memanggil fungsi fetchDataSDP untuk mengambil data dari SDP
		console.log("Data from SDP fetched successfully.");

		console.log("Fetching additional data from SDP...");
		await fetchedDataSDP(); // Memanggil fungsi fetchedDataSDP untuk mengambil data tambahan dari SDP
		console.log("Additional data from SDP fetched successfully.");

		console.log("Fetching page...");
		const page = await fetchPage(1); // Memanggil fungsi fetchPage untuk mengambil data halaman pertama
		console.log("Page fetched successfully:", page);

		console.log("Fetching and inserting data if needed...");
		await fetchAndInsertDataIfNeeded(); // Memanggil fungsi fetchAndInsertDataIfNeeded untuk mengambil dan memasukkan data jika diperlukan
		console.log("Data fetched and inserted successfully.");

		console.log("All operations completed successfully.");
	} catch (error) {
		console.error("Error:", error.message);
	}
};

fetchData(); // Panggil fungsi fetchData untuk menjalankan semua operasi
