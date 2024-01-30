import puppeteer from "puppeteer";
import fs from "fs/promises";

const loginPage = async () => {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	await page.goto("https://it-helpdesk.itb.ac.id/", {
		waitUntil: "networkidle2",
	});

	await page.click("#loginBoxSubContainer > div");
	await page.type("#username", "helpdesk");
	await page.type("#password", "Ganesha24!");
	await page.click("#loginSDPage");

	const cookies = await page.cookies();
	await fs.writeFile("./cookies.json", JSON.stringify(cookies, null, 2));
	await browser.close(); // Fix: Added parentheses to close()

	return cookies; // Added a return statement to return the cookies
};

loginPage();
export default loginPage; // Fixed the export statement
