//read .env data
import * as dotenv from "dotenv";
dotenv.config();

import { ConfigVars } from "./configVars";

import * as API from "loraserver-api-client-nodejs";
import http from 'http';

const formatError = (error: any, msg: string, func: Function) => {
	if (error.response && error.response.statusCode && error.response.statusMessage) {
		var err = <{ response: http.ClientResponse; body: any; }>error;
		func(msg + " error " + err.response.statusCode + ": " + err.response.statusMessage);
	} else {
		func(error);
	}
}

const printErrorAndBail = (error: any) => {
	console.error(error);
	process.exit(-1);
}

const getApiKey = async (user: string, password: string) => {
	return new Promise<API.ApiKeyAuth>(async (resolve, reject) => {
		var internalApi = new API.InternalServiceApi(process.env[ConfigVars.BasePath]);

		try {
			var resp = await internalApi.login({
				username: user,
				password: password
			});
			//resolve(resp.body.jwt);
			var auth = new API.ApiKeyAuth("header", "Grpc-Metadata-Authorization");
			auth.apiKey = resp.body.jwt;
			resolve(auth);

		} catch (error) {
			formatError(error, "getApiKey", reject);
		}
	});
}

//get JWT as string
const getJWT = async (auth: API.ApiKeyAuth)=> {
	return auth.apiKey;
}

const getApps = async (auth: API.ApiKeyAuth, options?: { limit?: number, offset?: number, organizationId?: string, search?: string }) => {

	var limit = "1000";
	var offset: string | undefined = undefined;
	var organizationId: string | undefined = undefined;
	var search: string | undefined = undefined;

	if (options) {
		if (options.limit) limit = options.limit.toString();
		if (options.offset) offset = options.offset.toString();
		if (options.organizationId) organizationId = options.organizationId;
		if (options.search) search = options.search;
	}

	return new Promise<API.ApiApplicationListItem[]>(async (resolve, reject) => {
		var apps = new API.ApplicationServiceApi(process.env[ConfigVars.BasePath]);
		apps.setDefaultAuthentication(auth);

		try {
			var res = await apps.list(limit, offset, organizationId, search);
			resolve(res.body.result);
		} catch (error) {
			formatError(error, "getApps", reject);
		}
	});
}

const getDevices = async (auth: API.ApiKeyAuth, options: { limit?: number, offset?: number, applicationID?: string, search?: string, multicastGroupID?: string, serviceProfileID?: string }) => {

	var limit = "1000";
	var offset: string | undefined = undefined;
	var applicationID: string | undefined = undefined;
	var search: string | undefined = undefined;
	var multicastGroupID: string | undefined = undefined;
	var serviceProfileID: string | undefined = undefined;

	if (options) {
		if (options.limit) limit = options.limit.toString();
		if (options.applicationID) applicationID = options.applicationID;
		if (options.search) search = options.search;
		if (options.multicastGroupID) multicastGroupID = options.multicastGroupID;
		if (options.serviceProfileID) serviceProfileID = options.serviceProfileID;
	}

	return new Promise<API.ApiDeviceListItem[]>(async (resolve, reject) => {
		var devices = new API.DeviceServiceApi(process.env[ConfigVars.BasePath]);
		devices.setDefaultAuthentication(auth);
		try {
			var res = await devices.list(limit, offset, applicationID, search, multicastGroupID, serviceProfileID);
			resolve(res.body.result);
		} catch (error) {
			formatError(error, "getDevices", reject);
		}
	});
}

var main = async () => {
	try {
		if (!process.env[ConfigVars.User] || !process.env[ConfigVars.Password] || !process.env[ConfigVars.BasePath]) {
			printErrorAndBail("Define username, password and basepath");
		}
		var apiKey = await getApiKey(<string>process.env[ConfigVars.User], <string>process.env[ConfigVars.Password]);
		console.log("Logged in");

		var apps = await getApps(apiKey, { search: "example-app" });
		//console.log(apps);
		
		if (!apps.length) printErrorAndBail("App not found");
		var app = apps[0];
		console.log("App Id: "+app.id);

		var devs = await getDevices(apiKey, { applicationID: app.id, search: "stm32-test-board" });
		//console.log(devs);

		if (!devs.length) printErrorAndBail("Dev not found");
		var dev = devs[0];
		console.log("DevEui: "+dev.devEUI);

	} catch (error) {
		console.error(error);
		process.exit(-1);
	}
};

main();
