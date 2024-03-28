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
				"accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
				"content-type": "application/json;charset=utf-8",
				"portal-issuingauthority": "111111",
				"request-id": "|2fa56d53e31b417ab8984763d2e5f366.5eec1588fe0f4a68",
				"sec-ch-ua":
					'"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"Windows"',
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				traceparent: "00-2fa56d53e31b417ab8984763d2e5f366-5eec1588fe0f4a68-01",
				"x-requested-with": "XMLHttpRequest",
				cookie:
					"mc=localeCode=en-us; prefCulture=en-us; OptanonAlertBoxClosed=2024-03-01T03:49:44.412Z; ai_user=b4i4r0/SPOhgXrCcW3iyW5|2024-03-01T03:49:48.691Z; OptanonConsent=isGpcEnabled=0&datestamp=Mon+Mar+25+2024+11%3A18%3A49+GMT%2B0700+(Indochina+Time)&version=202310.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=fab527c3-1c72-4574-b4ad-73ef1d2e1f03&interactionCount=2&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1%2CC0005%3A1&AwaitingReconsent=false&geolocation=ID%3BJB; ai_session=nbfx1Y5xvLgtpbCwhhAXN9|1711339927060|1711340329180; .ASPXAUTH=850983C01FCC9DD74CD783A8602C2666683B11F9FEA05537B310DADD144267644ABA0FC29699EB06E8BA264B6FEF458096690DCFEA5FDF14B7F704AB2AAB459281041B377B03A26DDEEA69C3FC1F6F49A6095DD8D26D4BE8C13F5B93A4B8CF5BC2DC9C8394AFCFDFE12232B266D3975F006FB821FB494D33EA0C39BEEA19B55CD73D2097092F0E52A44F47AA9A11EF5B088F1BBCBDCE443A406D3CA0B3876B4939964D9B4B5497168759667F6B4DB5CAF9C52E30C9F280188D8890B34BC718FD0B52E007326CC0EC3E20C6A83F1D3DB47952F389E9707BAE1D62F7FA49976087DDAEBDF759E8982A79F48DE236E401376AD689BBFF7ACB7EF6DB579D0B4D277EE24DE2F17377C4E4E6A1F515AF8ED468A91E3E50F8EC4A716BD32F32D4D57B2E13FEF56F83182DB1FC968C49CA56BAFB240C0172FE12C74478F22A1B50326A36A28ABE91E831E3D154193B7976D9AA08E32324C0D566C5C318A8140830A6273977816F3ECFE6E49BCF0EAE9F5D73540F183F5E2B256FC6A86E9C4D758CDE7E96751BF4FE33A28857DA6B93B0FFB1A4927ED7DA90FDF33171856AAC7899379CA5F393762897967853BC0987A2DA9E407C3941F9CB195C22DB8E4E7F00AE5C2FA9C1C3DF5CF6B4FD0C987407FDC485D3539EAD47448792D2B9B9AC44606537A6CA7FBD633987DD2ADAD5F765BD862C084130827CB9CEC0F56ADF4C2CF45D624ACD3476A7F62BBCABBAFC187E853BD851648E0AEE1A7DE291E125F8EE23B40CB31880357371104722DB96B2F7DD41D552E892F4F170BB365A3F35B400E59B897A88F7B0467657B0ABCBC9652CD1782F7ABC083960424C6694D0B1CAA230A3B3F13AF3310588EEC1CE7B847D7029C27832485F763117DC39FA2BE2F0098B8DAF729317FCFB191D4546AFCA0555DAAF97AC5C83610CF4A4F2F2508096AFC46E5F24394D63C6EA52AF126BDE37907059AF64B4D6C3873CE69BA92AA857259A3300B7CF5E641B92DE271E86B0FF2E627FD80E8C31E9F9C48AB608E0EB601457284C23839B54577A89CDD047E8245FC8401D7C436B12CECBCA86CEE5D1816C115F5FF5C319F81B2106593FDB3A646254AB456E1B72E3EEA9",
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
