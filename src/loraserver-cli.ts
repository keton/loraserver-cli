//read .env data
import * as dotenv from "dotenv";
dotenv.config();

import { ConfigVars } from "./configVars";
import LoraServerAPI from "loraserver-api-client-nodejs";

const printErrorAndBail = (error: any) => {
	console.error(error);
	process.exit(-1);
}

var main = async () => {
	try {
		if (!process.env[ConfigVars.User] || !process.env[ConfigVars.Password] || !process.env[ConfigVars.BasePath]) {
			throw new Error("Define username, password and basepath");
		}

		//construct API class
		var api = new LoraServerAPI(<string>process.env[ConfigVars.BasePath]);

		//login, get API key
		await api.login(<string>process.env[ConfigVars.User], <string>process.env[ConfigVars.Password]);
		console.log("Logged in");

		//get application list
		var apps = await api.applications.list({ search: "example-app" });

		if (!apps.length) printErrorAndBail("App not found");
		var app = apps[0];
		console.log("App Id: " + app.id);

		//get devices list
		var devs = await api.devices.list({ applicationID: app.id, search: "stm32-test-board" });

		if (!devs.length) printErrorAndBail("Dev not found");
		var dev = devs[0];
		console.log("DevEui: " + dev.devEUI);

	} catch (error) {
		printErrorAndBail(error);
	}
}

main();
