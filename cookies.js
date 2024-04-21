import puppeteer from "puppeteer";
import fs from "fs/promises";

// Fungsi untuk login ke SDP dan menyimpan cookies
// Fungsi untuk login ke SDP dan menyimpan cookies
const loginSDP = async () => {
	try {
		const cookiesExist = await fs
			.access("./cookies.json")
			.then(() => true)
			.catch(() => false);

		let browser, page;

		if (!cookiesExist) {
			// Jika cookies belum ada, lakukan login dan simpan cookies
			browser = await puppeteer.launch({ headless: false });
			page = await browser.newPage();
			await page.goto("https://it-helpdesk.itb.ac.id/");
			await page.click("#loginBoxSubContainer > div");
			await page.type("#username", "helpdesk");
			await page.type("#password", "Ganesha2024!");
			await page.click("#signedInCB");
			await page.click("#loginSDPage");

			// Tunggu hingga halaman selesai dimuat
			await page.waitForNavigation();

			// Periksa apakah login berhasil dengan mengecek apakah elemen target muncul
			const isLoginSuccessful = await page.evaluate(() => {
				return document.querySelector("#loginBoxSubContainer") === null;
			});

			if (!isLoginSuccessful) {
				console.log("Login gagal. Mohon periksa kredensial Anda.");
				return;
			}

			console.log("Login berhasil!");

			const cookies = await page.cookies();
			const cookiesData = JSON.stringify(cookies, null, 2);
			await fs.writeFile("./cookies.json", cookiesData);
			console.log("Cookies disimpan:", cookiesData);
		} else {
			// Jika cookies sudah ada, cek kevalidannya
			const cookiesData = await fs.readFile("./cookies.json");
			const cookies = JSON.parse(cookiesData);
			browser = await puppeteer.launch({ headless: false });
			page = await browser.newPage();
			await page.setCookie(...cookies);

			try {
				await page.goto("https://it-helpdesk.itb.ac.id/");

				// Tunggu hingga halaman selesai dimuat
				await page.waitForNavigation();

				// Periksa apakah login berhasil dengan mengecek apakah elemen target muncul
				const isLoginSuccessful = await page.evaluate(() => {
					return document.querySelector("#loginBoxSubContainer") === null;
				});

				if (!isLoginSuccessful) {
					console.log("Cookies sudah kadaluarsa. Mengambil cookies baru...");
					await fetchFreshCookies();
				} else {
					console.log("Cookies masih valid. Melanjutkan proses login...");
				}
			} catch (error) {
				console.log(
					"Terjadi kesalahan saat memeriksa validitas cookies:",
					error
				);
				return;
			}
		}

		await browser.close();
	} catch (error) {
		console.error("Terjadi kesalahan saat login:", error);
	}
};

// Fungsi untuk mengambil cookies baru
const fetchFreshCookies = async () => {
	try {
		// Hapus file cookies.json jika sudah ada
		await fs.unlink("./cookies.json");

		// Ambil cookies baru
		const browser = await puppeteer.launch({ headless: false });
		const page = await browser.newPage();
		await page.goto("https://it-helpdesk.itb.ac.id/");
		await page.click("#loginBoxSubContainer > div");
		await page.type("#username", "helpdesk");
		await page.type("#password", "Ganesha2024!");
		await page.click("#signedInCB");
		await page.click("#loginSDPage");
		await page.waitForSelector("#loginBoxSubContainer", { hidden: true });

		console.log("Login berhasil!");
		const cookies = await page.cookies();
		const cookiesData = JSON.stringify(cookies, null, 2);
		await fs.writeFile("./cookies.json", cookiesData);
		console.log("Cookies baru disimpan:", cookiesData);
		await browser.close();
	} catch (error) {
		console.error("Terjadi kesalahan saat mengambil cookies baru:", error);
	}
};

// Eksekusi login saat modul diimpor
loginSDP();
export default loginSDP;
