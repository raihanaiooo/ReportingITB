import puppeteer from "puppeteer";
import fs from "fs/promises";

let cookiesData = null;
let continueFetching = true;

// -------------------- FETCH COOKIES SDP --------------------
const checkLogoutSDP = async (page) => {
	try {
		await page.waitForSelector("#loginSDPage", {
			visible: true,
			timeout: 3000,
		});
		console.log("Logout detected. Refreshing token...");
		await refreshTokenSDP(page);
	} catch (error) {
		console.log(
			"Cookies expired or logout detected. Fetching fresh cookies..."
		);
		await fetchFreshCookies();
	}
};

const loginSDP = async () => {
	try {
		const cookiesExist = await fs
			.access("./cookies.json")
			.then(() => true)
			.catch(() => false);

		let browser;
		let page;

		if (!cookiesExist) {
			browser = await puppeteer.launch({ headless: false });
			page = await browser.newPage();
			await page.goto("https://it-helpdesk.itb.ac.id/");
			await page.click("#loginBoxSubContainer > div");
			await page.type("#username", "helpdesk");
			await page.type("#password", "Ganesha2024!");
			await page.click("#signedInCB");
			await page.click("#loginSDPage");

			await page.waitForSelector("#loginBoxSubContainer", { hidden: true });

			console.log("Login successful!");

			const cookies = await page.cookies();
			const cookiesData = JSON.stringify(cookies, null, 2);
			await fs.writeFile("./cookies.json", cookiesData);
			console.log("Cookies saved:", cookiesData);
		} else {
			console.log("Cookies already exist. Checking validity...");
			const cookiesData = await fs.readFile("./cookies.json");
			const cookies = JSON.parse(cookiesData);
			browser = await puppeteer.launch({ headless: false });
			page = await browser.newPage();
			await page.setCookie(...cookies);

			try {
				await page.goto("https://it-helpdesk.itb.ac.id/");
				await page.waitForSelector("#loginSDPage", {
					visible: true,
					timeout: 3000,
				});
				console.log("Cookies are valid. Continuing login process...");
			} catch (error) {
				console.log("Cookies are expired. Fetching fresh cookies...");
				await fetchFreshCookies();
			}
		}

		await browser.close();
	} catch (error) {
		console.error("Error during login:", error);
	}
};

const refreshTokenSDP = async (page) => {
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
				return result.json();
			} catch (error) {
				console.error("Error in API call:", error.message);
				return { error: error.message };
			}
		});
		console.log("API Response:", response);
		if (response && !response.error && response.cookies !== null) {
			const updatedCookies = response.cookies;
			const updatedCookiesData = JSON.stringify(updatedCookies, null, 2);
			await fs.writeFile("./cookies.json", updatedCookiesData);
			console.log("Token refreshed and updated!");
			await saveCookiesSDP(updatedCookiesData);
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

const saveCookiesSDP = async (cookiesData) => {
	try {
		await fs.writeFile("./cookies.json", cookiesData);
		console.log("Cookies saved to cookies.json");
	} catch (error) {
		console.error("Error saving cookies to file:", error);
	}
};

const fetchFreshCookies = async () => {
	try {
		// Delete cookies.json file if it already exists
		await fs.unlink("./cookies.json");

		// Fetch new cookies
		const browser = await puppeteer.launch({ headless: false });
		const page = await browser.newPage();
		await page.goto("https://it-helpdesk.itb.ac.id/");
		await page.click("#loginBoxSubContainer > div");
		await page.type("#username", "helpdesk");
		await page.type("#password", "Ganesha2024!");
		await page.click("#signedInCB");
		await page.click("#loginSDPage");
		await page.waitForSelector("#loginBoxSubContainer", { hidden: true });
		console.log("Login successful!");
		const cookies = await page.cookies();
		const cookiesData = JSON.stringify(cookies, null, 2);
		await fs.writeFile("./cookies.json", cookiesData);
		console.log("New cookies saved:", cookiesData);
		await browser.close();
	} catch (error) {
		console.error("Error fetching fresh cookies:", error);
	}
};

// // -------------------- FETCH COOKIES MINITAB --------------------
// const checkLogoutMinitab = async (page) => {
// 	try {
// 		// Cek apakah elemen logout muncul setelah logout
// 		await page.waitForSelector("#signIn", {
// 			visible: true,
// 			timeout: 3000,
// 		});

// 		console.log("Logout detected. Refreshing token...");

// 		// Jalankan kembali fungsi refreshTokenSDP
// 		await refreshTokenMinitab(page);
// 	} catch (error) {
// 		// Jika elemen logout tidak ditemukan, panggil fetchFreshCookies
// 		console.log(
// 			"Cookies expired or logout detected. Fetching fresh cookies..."
// 		);
// 		await fetchFreshCookies2();
// 	}
// };

// const loginMinitab = async () => {
// 	try {
// 		// Cek apakah cookies sudah ada
// 		const cookiesExist = await fs
// 			.access("./minitab.json")
// 			.then(() => true)
// 			.catch(() => false);

// 		let page;

// 		if (!cookiesExist) {
// 			const browser = await puppeteer.launch({ headless: false });
// 			page = await browser.newPage();
// 			await page.goto("https://licensing.minitab.com/Login?ReturnUrl=%2F");
// 			await page.waitForSelector("#userName", { visible: true });
// 			await page.type("#userName", "software@itb.ac.id");
// 			await page.click("#keepSignIn");
// 			await page.click("#signIn");
// 			await page.waitForTimeout(2000);
// 			await page.waitForSelector("#password", { visible: true });
// 			await page.type("#password", "Ganesha10!");
// 			await page.click("#signIn");

// 			console.log("Login successful!");

// 			// Setelah login sukses, simpan cookies
// 			const cookies = await page.cookies();
// 			const cookiesData = JSON.stringify(cookies, null, 2);
// 			await fs.writeFile("./minitab.json", cookiesData);
// 			console.log("Cookies saved:", cookiesData);

// 			await browser.close();
// 		} else {
// 			console.log("Cookies already exist. Skipping login.");
// 		}

// 		// Panggil checkLogout hanya sekali setelah login
// 		if (page) {
// 			await checkLogoutMinitab(page);
// 		}
// 	} catch (error) {
// 		console.error("Error during login:", error);
// 	}
// };

// const refreshTokenMinitab = async (page) => {
// 	try {
// 		const cookiesData = await fs.readFile("./minitab.json");
// 		const cookies = JSON.parse(cookiesData);
// 		await page.setCookie(...cookies);

// 		const response = await page.evaluate(async () => {
// 			try {
// 				const result = await fetch(
// 					"https://licensing.minitab.com/Login?ReturnUrl=%2F",
// 					{
// 						method: "POST",
// 						credentials: "include",
// 						headers: {
// 							"Content-Type": "application/json",
// 						},
// 					}
// 				);

// 				if (!result.ok) {
// 					throw new Error(`Failed to refresh token. Status: ${result.status}`);
// 				}

// 				return result.json();
// 			} catch (error) {
// 				console.error("Error in API call:", error.message);
// 				return { error: error.message };
// 			}
// 		});

// 		console.log("API Response:", response);

// 		if (response && !response.error && response.cookies !== null) {
// 			const updatedCookies = response.cookies;
// 			const updatedCookiesData = JSON.stringify(updatedCookies, null, 2);
// 			await fs.writeFile("./minitab.json", updatedCookiesData);
// 			cookiesData = updatedCookiesData;
// 			console.log("Token refreshed and updated!");
// 			await saveCookiesMinitab();
// 		} else {
// 			console.error(
// 				"Error refreshing token:",
// 				response && response.error
// 					? response.error
// 					: "Invalid response or null cookies"
// 			);
// 		}
// 	} catch (error) {
// 		console.error("Error refreshing token:", error);
// 	}
// };

// const saveCookiesMinitab = async () => {
// 	try {
// 		await fs.writeFile("minitab.js", `const cookiesData = ${cookiesData};`);
// 		console.log("Cookies saved to minitab.js");
// 	} catch (error) {
// 		console.error("Error saving cookies to file:", error);
// 	}
// };

// const fetchFreshCookies2 = async () => {
// 	try {
// 		// Hapus file cookies.json jika sudah ada
// 		await fs.unlink("./minitab.json");

// 		// Fetch cookies yang baru
// 		const browser = await puppeteer.launch({ headless: false });
// 		const page = await browser.newPage();
// 		await page.goto("https://licensing.minitab.com/Login?ReturnUrl=%2F");

// 		// Isi form login jika diperlukan
// 		await page.waitForSelector("#userName", { visible: true });
// 		await page.type("#userName", "software@itb.ac.id");
// 		await page.click("#keepSignIn");
// 		await page.click("#signIn");
// 		await page.waitForTimeout(2000);
// 		await page.waitForSelector("#password", { visible: true });
// 		await page.type("#password", "Ganesha10!");
// 		await page.click("#signIn");

// 		// Tunggu hingga proses login selesai
// 		// await page.waitForSelector("#loginBoxSubContainer", { hidden: true });

// 		console.log("Login successful!");

// 		// Simpan cookies yang baru
// 		const cookies = await page.cookies();
// 		const cookiesData = JSON.stringify(cookies, null, 2);
// 		await fs.writeFile("./minitab.json", cookiesData);
// 		console.log("New cookies saved:", cookiesData);

// 		await browser.close();
// 	} catch (error) {
// 		console.error("Error fetching fresh cookies:", error);
// 	}
// };

// fungsi untuk menjalankan keduanya
const Login = async () => {
	try {
		await loginSDP();
		console.log("Logins completed.");
	} catch (error) {
		console.error("Error during login:", error);
	}
};

Login();
export default Login;
