import { MongoClient } from "mongodb"
import config from "../../config.json"

export class Database {
	/** */
	constructor() {
		this.client = new MongoClient(config.dbConnectionString ?? "mongodb://localhost:27017")
		this.db = this.client.db(config.metadataDbName)
	}
}
