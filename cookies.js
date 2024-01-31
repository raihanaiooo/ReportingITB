import puppeteer from "puppeteer";
import fs from "fs/promises";

const loginPage = async () => {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	await page.goto("https://it-helpdesk.itb.ac.id/", {
		waitUntil: "networkidle2",
		timeout: 30000,
	});

	await page.click("#loginBoxSubContainer > div");
	await page.type("#username", "helpdesk");
	await page.type("#password", "Ganesha24!");
	await page.click("#loginSDPage");

	await page.waitForNavigation(); // Wait for navigation to complete

	const cookies = await page.cookies();
	await fs.writeFile("./cookies.json", JSON.stringify(cookies, null, 2));
	await browser.close();

	return cookies;
};

const refreshAndSaveToken = async () => {
	try {
		const browser = await puppeteer.launch({ headless: false });
		const page = await browser.newPage();

		// Load cookies from the saved file
		const cookiesData = await fs.readFile("./cookies.json");
		const cookies = JSON.parse(cookiesData);

		// Set the cookies in the new page
		await page.setCookie(...cookies);

		// Open the desired page to refresh the token
		await page.goto("https://it-helpdesk.itb.ac.id/", {
			waitUntil: "networkidle2",
		});

		// Add logic to refresh the token here

		// Get updated cookies after refreshing the token
		const updatedCookies = await page.cookies();

		// Save the updated cookies to the file
		await fs.writeFile(
			"./cookies.json",
			JSON.stringify(updatedCookies, null, 2)
		);

		await browser.close();
		console.log("Token refreshed and updated!");
	} catch (error) {
		console.error("Error refreshing token:", error);
	}
};

// Usage example
loginPage().then(() => {
	// Refresh and save token after some time or when needed
	setInterval(refreshAndSaveToken, 3600000); // Refresh every hour (3600000 milliseconds)
});

export default loginPage;
