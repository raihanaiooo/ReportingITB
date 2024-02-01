import puppeteer from "puppeteer";
import fs from "fs/promises";

const loginPage = async () => {
	try {
		const browser = await puppeteer.launch({ headless: false });
		const page = await browser.newPage();
		await page.goto("https://it-helpdesk.itb.ac.id/");

		await page.click("#loginBoxSubContainer > div");
		await page.type("#username", "helpdesk");
		await page.type("#password", "Ganesha24!");
		await page.click("#loginSDPage");

		// Wait for the login form to disappear, indicating navigation is complete
		await page.waitForSelector("#loginBoxSubContainer", { hidden: true });

		console.log("Login successful!");

		// Save cookies after login
		const cookies = await page.cookies();
		await fs.writeFile("./cookies.json", JSON.stringify(cookies, null, 2));

		console.log("Cookies saved:", JSON.stringify(cookies, null, 2));

		// Call refreshAndSaveToken every 10 seconds
		setInterval(async () => await refreshAndSaveToken(page), 10000); // Refresh every 10 seconds

		await browser.close();
	} catch (error) {
		console.error("Error during login:", error);
	}
};

const refreshAndSaveToken = async (page) => {
	try {
		// Set cookies from the file before making the request
		const cookiesData = await fs.readFile("./cookies.json");
		const cookies = JSON.parse(cookiesData);
		await page.setCookie(...cookies);

		// Example: Make an API call to refresh the token
		const response = await page.evaluate(async () => {
			try {
				const result = await fetch("https://it-helpdesk.itb.ac.id/", {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!result.ok) {
					throw new Error(`Failed to refresh token. Status: ${result.status}`);
				}

				return result.json(); // Parse the response as JSON
			} catch (error) {
				console.error("Error in API call:", error.message);
				return { error: error.message }; // Return the error message
			}
		});

		console.log("API Response:", response);

		if (response && !response.error && response.cookies !== null) {
			const updatedCookies = response.cookies;
			await fs.writeFile(
				"./cookies.json",
				JSON.stringify(updatedCookies, null, 2)
			);
			console.log("Token refreshed and updated!");
		} else {
			console.error(
				"Error refreshing token:",
				response && response.error
					? response.error
					: "Invalid response or null cookies"
			);
		}
	} catch (error) {
		console.error("Error refreshing token:", error);
	}
};

// Usage example
loginPage();
