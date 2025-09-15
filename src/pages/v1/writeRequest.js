import { PendingDatastoreWrite, Request, TrackedServer, getApiKey } from "../../shared/mongoose.mjs"

export async function POST({ request }) {
	const apiKey = await getApiKey(request.headers.get("Authorization")).catch(() => null)
	if (!apiKey) return new Response("Unauthorized", { status: 401 })
	if (!apiKey.accessTypes.includes("write")) return new Response("Forbidden", { status: 403 })
	const output = {}
	const body = await request.json().catch(() => null)
	if (!body) return new Response("Invalid request body", { status: 400 })
	const key = body.key
	if (!key) return new Response("Key field is required", { status: 400 })
	const scope = body.scope || "global"
	const datastoreName = body.datastoreName
	if (!datastoreName) return new Response("Datastore name field is required", { status: 400 })
	const data = body.data
	if (!data) return new Response("Data field is required", { status: 400 })
	// save write
	await new PendingDatastoreWrite({ key, data }).save()
	// find a random tracked server
	const trackedServer = await TrackedServer.aggregate([{ $match: { lastHeartbeat: { $gt: new Date(Date.now() - 1000 * 11) } } }, { $sample: { size: 1 } }]).catch(() => null)
	if (!trackedServer || trackedServer.length === 0) return new Response("No available servers", { status: 503 })
	const server = trackedServer[0]
	const requestDocument = new Request({
		request: `write/${scope}/${datastoreName}/${key}`,
		data: {
			key,
			scope,
			datastoreName,
		},
		jobId: server.jobId,
		type: "persistent",
		scope: "roblox",
		persistentLastChecked: new Date(),
	})
	await requestDocument.save().catch(() => {
		return new Response("Error creating request", { status: 500 })
	})
	return new Response(JSON.stringify(output), {
		status: 201,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	})
}

export async function GET({ request }) {
	const apiKey = await getApiKey(request.headers.get("Authorization")).catch(() => null)
	if (!apiKey) return new Response("Unauthorized", { status: 401 })
	if (!apiKey.accessTypes.includes("read")) return new Response("Forbidden", { status: 403 })
	const queryParams = Object.fromEntries(new URL(request.url).searchParams.entries())
	const key = queryParams.key
	if (!key) return new Response("Key field is required", { status: 400 })

	const pendingWrite = await PendingDatastoreWrite.find({ key }).catch(() => null)
	if (!pendingWrite || pendingWrite.length === 0) return new Response("No pending write found", { status: 404 })
	const data = pendingWrite[0].data
	return new Response(data, {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	})
}

export async function DELETE({ request }) {
	const apiKey = await getApiKey(request.headers.get("Authorization")).catch(() => null)
	if (!apiKey) return new Response("Unauthorized", { status: 401 })
	if (!apiKey.accessTypes.includes("write")) return new Response("Forbidden", { status: 403 })
	const body = await request.json().catch(() => null)
	if (!body) return new Response("Invalid request body", { status: 400 })
	const key = body.key
	if (!key) return new Response("Key field is required", { status: 400 })

	const pendingWrite = await PendingDatastoreWrite.findOneAndDelete({ key }).catch(() => null)
	if (!pendingWrite) return new Response("No pending write found", { status: 404 })
	return new Response(JSON.stringify({ message: "Pending write deleted" }), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	})
}
