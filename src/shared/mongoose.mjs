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
	data: {
		type: Object,
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
	persistentLastChecked: {
		type: Date,
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
	metadataCollection: {
		type: String,
		default: "metadata"
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
	data: {
		type: Object,
		default: {},
	},
})

export const TrackedServer = mongoose.model("TrackedServer", trackedServerSchema)

export async function reassignDeadPersistentRequests() {
	// find persistent requests of servers which stopped responding
	const requests = await Request.find({
		type: "persistent",
		jobId: { $exists: true },
		persistentLastChecked: { $lt: new Date(Date.now() - 1000 * 20) }, // 20 seconds
	})

	await Promise.all(
		requests.map(async (request) => {
			// find a random tracked server
			const trackedServer = await TrackedServer.aggregate([{ $match: { lastHeartbeat: { $gt: new Date(Date.now() - 1000 * 11) } } }, { $sample: { size: 1 } }]).catch(() => null)
			if (!trackedServer || trackedServer.length === 0) {
				request.persistentLastChecked = new Date()
				return request.save().catch(() => {})
			}

			const server = trackedServer[0]
			request.jobId = server.jobId
			request.persistentLastChecked = new Date()
			await request.save().catch(() => {})
		})
	)
}
