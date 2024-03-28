import puppeteer from "puppeteer";
import fs from "fs/promises";

// Define cookies variable outside the functions
let cookiesData = null;

const loginPage = async () => {
	try {
		const browser = await puppeteer.launch({ headless: false });
		const page = await browser.newPage();
		await page.goto("https://it-helpdesk.itb.ac.id/");

		await page.click("#loginBoxSubContainer > div");
		await page.type("#username", "helpdesk");
		await page.type("#password", "Ganesha2024!");
		await page.click("#loginSDPage");

		await page.waitForSelector("#loginBoxSubContainer", { hidden: true });

		console.log("Login successful!");

		const cookies = await page.cookies();
		cookiesData = JSON.stringify(cookies, null, 2);

		await fs.writeFile("./cookies.json", cookiesData);

		console.log("Cookies saved:", cookiesData);

		setInterval(async () => await refreshAndSaveToken(page), 10000); // Refresh every 10 seconds

		// Call saveCookiesToFile after getting initial cookies
		await saveCookiesToFile();

		await browser.close();
	} catch (error) {
		console.error("Error during login:", error);
	}
};

const refreshAndSaveToken = async (page) => {
	try {
		const cookiesData = await fs.readFile("./cookies.json");
		const cookies = JSON.parse(cookiesData);
		await page.setCookie(...cookies);

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
			const updatedCookiesData = JSON.stringify(updatedCookies, null, 2);
			await fs.writeFile("./cookies.json", updatedCookiesData);
			cookiesData = updatedCookiesData;
			console.log("Token refreshed and updated!");

			// Call saveCookiesToFile after updating cookies
			await saveCookiesToFile();
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

const saveCookiesToFile = async () => {
	try {
		await fs.writeFile("sdp.js", `const cookiesData = ${cookiesData};`);
		console.log("Cookies saved to sdp.js");
	} catch (error) {
		console.error("Error saving cookies to file:", error);
	}
};

// Call loginPage to start the login process
loginPage();
