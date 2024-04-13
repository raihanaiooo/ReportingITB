import puppeteer from "puppeteer";
import fs from "fs/promises";

let cookiesData = null;

// -------------------- FETCH COOKIES SDP --------------------
const checkLogoutSDP = async (page) => {
	try {
		// Cek apakah elemen logout muncul setelah logout
		await page.waitForSelector("#loginSDPage", {
			visible: true,
			timeout: 3000,
		});

		console.log("Logout detected. Refreshing token...");

		// Jalankan kembali fungsi refreshTokenSDP
		await refreshTokenSDP(page);
	} catch (error) {
		// Jika elemen logout tidak ditemukan, panggil fetchFreshCookies
		console.log(
			"Cookies expired or logout detected. Fetching fresh cookies..."
		);
		await fetchFreshCookies();
	}
};

const loginSDP = async () => {
	try {
		// Cek apakah cookies sudah ada
		const cookiesExist = await fs
			.access("./cookies.json")
			.then(() => true)
			.catch(() => false);

		let page;

		if (!cookiesExist) {
			const browser = await puppeteer.launch({ headless: false });
			page = await browser.newPage();
			await page.goto("https://it-helpdesk.itb.ac.id/");
			await page.click("#loginBoxSubContainer > div");
			await page.type("#username", "helpdesk");
			await page.type("#password", "Ganesha2024!");
			await page.click("#signedInCB");
			await page.click("#loginSDPage");

			await page.waitForSelector("#loginBoxSubContainer", { hidden: true });

			console.log("Login successful!");

			// Setelah login sukses, simpan cookies
			const cookies = await page.cookies();
			const cookiesData = JSON.stringify(cookies, null, 2);
			await fs.writeFile("./cookies.json", cookiesData);
			console.log("Cookies saved:", cookiesData);

			await browser.close();
		} else {
			console.log("Cookies already exist. Skipping login.");
		}

		// Panggil checkLogout hanya sekali setelah login
		if (page) {
			await checkLogoutSDP(page);
		}
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
			cookiesData = updatedCookiesData;
			console.log("Token refreshed and updated!");
			await saveCookiesSDP();
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

const saveCookiesSDP = async () => {
	try {
		await fs.writeFile("sdp.js", `const cookiesData = ${cookiesData};`);
		console.log("Cookies saved to sdp.js");
	} catch (error) {
		console.error("Error saving cookies to file:", error);
	}
};

const fetchFreshCookies = async () => {
	try {
		// Hapus file cookies.json jika sudah ada
		await fs.unlink("./cookies.json");

		// Fetch cookies yang baru
		const browser = await puppeteer.launch({ headless: false });
		const page = await browser.newPage();
		await page.goto("https://it-helpdesk.itb.ac.id/");

		// Isi form login jika diperlukan
		await page.click("#loginBoxSubContainer > div");
		await page.type("#username", "helpdesk");
		await page.type("#password", "Ganesha2024!");
		await page.click("#signedInCB");
		await page.click("#loginSDPage");

		// Tunggu hingga proses login selesai
		await page.waitForSelector("#loginBoxSubContainer", { hidden: true });

		console.log("Login successful!");

		// Simpan cookies yang baru
		const cookies = await page.cookies();
		const cookiesData = JSON.stringify(cookies, null, 2);
		await fs.writeFile("./cookies.json", cookiesData);
		console.log("New cookies saved:", cookiesData);

		await browser.close();
	} catch (error) {
		console.error("Error fetching fresh cookies:", error);
	}
};

// -------------------- FETCH COOKIES MINITAB --------------------

const checkLogoutMinitab = async (page) => {
	try {
		// Cek apakah elemen logout muncul setelah logout
		await page.waitForSelector("#signIn", {
			visible: true,
			timeout: 3000,
		});

		console.log("Logout detected. Refreshing token...");

		// Jalankan kembali fungsi refreshTokenSDP
		await refreshTokenMinitab(page);
	} catch (error) {
		// Jika elemen logout tidak ditemukan, lanjutkan memantau
		setTimeout(() => checkLogoutMinitab(page), 1000);
	}
};

const loginMinitab = async () => {
	try {
		// Cek apakah cookies sudah ada
		const cookiesExist = await fs
			.access("./minitab.json")
			.then(() => true)
			.catch(() => false);
		// Jika cookies belum ada, lakukan proses login dan simpan cookies
		if (!cookiesExist) {
			const browser = await puppeteer.launch({ headless: false });
			const page = await browser.newPage();
			await page.goto("https://licensing.minitab.com/Login?ReturnUrl=%2F");

			await page.waitForSelector("#userName", { visible: true });
			await page.type("#userName", "software@itb.ac.id");
			await page.click("#keepSignIn");
			await page.click("#signIn");
			await page.waitForTimeout(2000);
			await page.waitForSelector("#password", { visible: true });
			await page.type("#password", "Ganesha10!");
			await page.click("#signIn");

			// await page.waitForSelector("#loginBoxSubContainer", { hidden: true });

			console.log("Login successful!");

			// Setelah login sukses, simpan cookies
			const cookies = await page.cookies();
			cookiesData = JSON.stringify(cookies, null, 2);
			await fs.writeFile("./minitab.json", cookiesData);
			console.log("Cookies saved:", cookiesData);

			// Panggil checkLogout setelah login sukses untuk memantau logout
			checkLogoutMinitab(page);

			await browser.close();
		} else {
			console.log("Cookies already exist. Skipping login.");
		}
	} catch (error) {
		console.error("Error during login:", error);
	}
};

const refreshTokenMinitab = async (page) => {
	try {
		const cookiesData = await fs.readFile("./minitab.json");
		const cookies = JSON.parse(cookiesData);
		await page.setCookie(...cookies);

		const response = await page.evaluate(async () => {
			try {
				const result = await fetch(
					"https://licensing.minitab.com/Login?ReturnUrl=%2F",
					{
						method: "POST",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

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
			await fs.writeFile("./minitab.json", updatedCookiesData);
			cookiesData = updatedCookiesData;
			console.log("Token refreshed and updated!");
			await saveCookiesMinitab();
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

const saveCookiesMinitab = async () => {
	try {
		await fs.writeFile("minitab.js", `const cookiesData = ${cookiesData};`);
		console.log("Cookies saved to sdp.js");
	} catch (error) {
		console.error("Error saving cookies to file:", error);
	}
};

const Login = async () => {
	try {
		await loginSDP();
		await loginMinitab();
		console.log("Both logins completed successfully.");
	} catch (error) {
		console.error("Error during login:", error);
	}
};
// Login();
export default Login;
