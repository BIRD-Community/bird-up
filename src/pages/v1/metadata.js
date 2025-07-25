import { db } from "../../shared/db.mjs"
import { getApiKey } from "../../shared/mongoose.mjs"
import { BSON } from "mongodb"
const { EJSON } = BSON

export async function POST({ request }) {
	const apiKey = await getApiKey(request.headers.get("Authorization")).catch(() => null)
	if (!apiKey) return new Response("Unauthorized", { status: 401 })
	if (!apiKey.accessTypes.includes("write")) return new Response("Forbidden", { status: 403 })
	const output = {}
	const body = await request.json().catch(() => null)
	if (!body) return new Response("Invalid request body", { status: 400 })
	const type = body.type
	if (!type) return new Response("Type field is required", { status: 400 })
	const collection = db.db.collection(apiKey.metadataCollection)

	switch (type) {
		case "find":
			const query = body.query ?? {}
			const projection = body.projection
			const limit = body.limit ?? 100
			const skip = body.skip ?? 0
			return collection
				.find(query, { projection })
				.skip(skip)
				.limit(limit)
				.toArray()
				.then((data) => {
					output.data = data.map((item) => EJSON.serialize(item))
					return new Response(JSON.stringify(output), {
						status: 200,
						headers: {
							"Content-Type": "application/json",
							"Cache-Control": "no-cache",
						},
					})
				})
				.catch(() => new Response("Error finding data", { status: 500 }))
		case "insert":
			const insertData = body.data
			if (!insertData) return new Response("Data field is required", { status: 400 })
			return collection
				.insertOne(EJSON.deserialize(insertData))
				.then((result) => {
					output.insertedId = result.insertedId
					return new Response(JSON.stringify(output), {
						status: 201,
						headers: {
							"Content-Type": "application/json",
							"Cache-Control": "no-cache",
						},
					})
				})
				.catch(() => new Response("Error inserting data", { status: 500 }))
		case "update":
			if (!body.query || !body.data) return new Response("Query and data fields are required", { status: 400 })
			const updateQuery = EJSON.deserialize(body.query)
			const updateDocument = EJSON.deserialize(body.data)
			return collection
				.updateMany(updateQuery, updateDocument)
				.then((result) => {
					output.modifiedCount = result.modifiedCount
					return new Response(JSON.stringify(output), {
						status: 200,
						headers: {
							"Content-Type": "application/json",
							"Cache-Control": "no-cache",
						},
					})
				})
				.catch(() => new Response("Error updating data", { status: 500 }))
		default:
			return new Response("Invalid type", { status: 400 })
	}
}
