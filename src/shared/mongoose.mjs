import config from "../../config.json"
import mongoose from "mongoose"
import { randomBytes } from "crypto"
const { Schema } = mongoose

const connectionString = config.connectionString ?? "mongodb://localhost:27017/birdup"

mongoose.connect(connectionString)

const requestSchema = new Schema({
	request: {
		type: String,
		required: true,
		index: true,
	},
	jobId: {
		type: String,
	},
	type: {
		type: String,
		enum: ["job-bound", "global", "persistent"],
		default: "job-bound",
		index: true,
	},
	scope: {
		type: String,
		enum: ["roblox"],
		default: "roblox",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

export const Request = mongoose.model("Request", requestSchema)

const pendingDatastoreWriteSchema = new Schema({
	key: {
		type: String,
		required: true,
		index: true,
	},
	data: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

export const PendingDatastoreWrite = mongoose.model("PendingDatastoreWrite", pendingDatastoreWriteSchema)

const apiKeySchema = new Schema({
	key: {
		type: String,
		required: true,
		index: true,
		unique: true,
		default: () => randomBytes(48).toString("base64url"),
	},
	accessTypes: {
		type: [String],
		enum: ["read", "write", "edit-keys", "roblox"],
		default: [],
	},
	description: {
		type: String,
		default: "",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

export const ApiKey = mongoose.model("ApiKey", apiKeySchema)

export function getApiKey(key) {
	if (typeof key !== "string" || key.length === 0) {
		throw new Error("Invalid API key")
	}

	return ApiKey.findOne({ key }).exec()
}

const trackedServerSchema = new Schema({
	jobId: {
		type: String,
		required: true,
		index: true,
		unique: true,
	},
	lastHeartbeat: {
		type: Date,
		default: Date.now,
		index: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

export const TrackedServer = mongoose.model("TrackedServer", trackedServerSchema)
