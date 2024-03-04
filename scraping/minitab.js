import axios from "axios";
import { insertMinitab } from "../db/insert.js";
import createDbPool from "../config.js";

const pool = createDbPool();

const apiUrl =
	"https://licensing.minitab.com/api/v1/subscriptions/8b127d5f3f48492cbed3ac291a9e2533/products/e68147de1c46451bafadcfcc44e196cc/users?q=matchall&take=25&startToken=";

const fetchDataMinitab = async () => {
	let db;
	try {
		db = await pool.getConnection();

		const requestBody = {
			list_info: {
				get_total_count: true,
			},
			Users: [],
			Total: 0,
			NextToken: "25",
		};
		const bodyString = JSON.stringify(requestBody);
		const response = await axios.get(apiUrl, {
			data: bodyString,
			headers: {
				accept: "application/json, text/javascript, */*; q=0.01",
				"accept-language":
					"id-ID,id;q=0.9,ja-JP;q=0.8,ja;q=0.7,en-US;q=0.6,en;q=0.5",
				"content-type": "application/json;charset=utf-8",
				"portal-issuingauthority": "111111",
				"request-id": "|707bdd019ba74cfc82ae9cf1325340c7.c621a63f193f4441",
				"sec-ch-ua":
					'"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"Windows"',
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				traceparent: "00-707bdd019ba74cfc82ae9cf1325340c7-c621a63f193f4441",
				"x-requested-with": "XMLHttpRequest",
				cookie:
					"mc=localeCode=en-us; prefCulture=en-us; OptanonAlertBoxClosed=2024-03-01T03:49:44.412Z; ai_user=b4i4r0/SPOhgXrCcW3iyW5|2024-03-01T03:49:48.691Z; OptanonConsent=isGpcEnabled=0&datestamp=Mon+Mar+04+2024+08%3A26%3A15+GMT%2B0700+(Indochina+Time)&version=202310.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=fab527c3-1c72-4574-b4ad-73ef1d2e1f03&interactionCount=2&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1%2CC0005%3A1&AwaitingReconsent=false&geolocation=ID%3BJB; .ASPXAUTH=AB5FF9B033001C743655B185D88D316F688ADBA95B9DFFE0892FB54E78E092D8C31CE99EFDA585E5D7961CBDA652988487C6A4E14F64F4EAAC2A6AE4CBF13648C80C667597AAB33D0B419E56012700225EBDD9700E25A63A4A7878BAE572C7D526C4EDFD35A5F48FF7A4F0174E011897D6672A12A0FF45CDD5A143F840A2C82681866C406F0FA8F6A055B599845310C84F49F1A46385AC514DC3F9BBE9091E4459BB7E14B5C8B22B8206CB1F10AC8FC78F49202D65A2CA86C3D2354805270733E3981CB67205EBF97679C60D2E6EC6C67EAF67ADA8E2999758F05990CB09F48FA6A351DF44C49553C6DC0CEC6B5DE3239DDE3910BD46B0CD7CCD94C580AB0D7A981E6B6C67DCCC1B71E88D66EBF83700B5A049544A4478751D50B2E416BECBA56EB0377815B796D622E281755C4804597C078860D079F8C4517411E30ABE0A8A6E096A3C3065DE393FCB91FDECA8B5886165426FBF84AF2D8482302EB8F62DDBF63EE100B7E9614041CF26C7F2AD95E7BC6C2AE5B470211DD4FA9F38FDD1360BDD0AA8B510A88B66BD1986AC715BB8AB3C0A57ADA9D845A96E47A5AA62C13C14591803C683ED50179461B0F3AE36FC808B38EAEFF3DD2F3937CFAB907E9C179E49A182D31119DB85F47F7C4B7AD5FFF0F34B5A8829BB84BEDC9F0BC3C1539EFF2B31224BA752F4DF00362E79C5FF01BC0B10023AC98A91BF3CA134570F3291A4CAADEE35F25E990772FE4DE98C233D6C38DDE436DB61E581A0C76D2A0F729757F1F94C2475E67A24356F433B7690D0F6D923E51C620EA1CCB247417B59A992C76C9440CE1CB49CF7D06190F34206F0EBE4B69B2B89E721773705E8AE091371F143D8AE0C075FA4311F77B99B95435099C4EDFCFD157EA01D659B20C9F7F73613926AC443FFF1E8A4AE0CCA033FB769478BCB3038C0CA101436F36A082BE87C30574B2BDA38F4ACA0C1F014D23A8B29998DD15DF6CF71070C562F4B0B909D7CBA072DCE93DAAA720ADDA98BA4D8603EDF98A061FEA577588024BB3D70E6EAAA16517F7C666550B8DB3D78D9210E610D42CC510EC45DADDDDF1C6F7C8908BCBF3986D21C77B903DF0CE344F38BF79B850F6D82FCE5; ai_session=0U2hFS2bpK/WLej8+c49rH|1709515083746|1709515575954",
				Referer:
					"https://licensing.minitab.com/?manage=1&sub=8b127d5f3f48492cbed3ac291a9e2533&prod=e68147de1c46451bafadcfcc44e196cc",
				"Referrer-Policy": "strict-origin-when-cross-origin",
			},
		});

		console.log("API Response:", response.data); // Log the entire response

		const totalUsers = response.data.Total;

		if (typeof totalUsers !== "number") {
			throw new Error("Invalid data format or missing Total property");
		}

		await insertMinitab(db, { Total: totalUsers });

		console.log("Data berhasil dimasukkan ke dalam database.");
	} catch (error) {
		console.error("Error:", error.message);
		if (error.response && error.response.data) {
			console.error("Server Error Response:", error.response.data);
		}
	} finally {
		if (db) {
			db.release();
		}
	}
};

export default fetchDataMinitab;
