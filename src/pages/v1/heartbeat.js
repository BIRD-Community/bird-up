import { getApiKey, Request } from "../../shared/mongoose.mjs"

export async function POST({ request }) {
	const apiKey = await getApiKey(request.headers.get("Authorization")).catch(() => null)
	if (!apiKey) {
		return new Response("Unauthorized", { status: 401 })
	}

	const responseData = {}
	if (apiKey.accessTypes.includes("write")) {
		// parse body
		const body = await request.json().catch(() => null)
		if (!body) {
			return new Response("Invalid request body", { status: 400 })
		}
		const jobId = body.jobId
		if (!jobId) {
			return new Response("Job ID is required", { status: 400 })
		}
		const dismissedRequests = body.dismissedRequests || []
		// delete dismissed requests
		if (dismissedRequests.length > 0) {
			await Request.deleteMany({
				jobId: { $in: dismissedRequests },
			})
		}
		// query job-bound and global requests in parallel
		const [requests, globalRequests] = await Promise.all([
			Request.find({
				jobId: jobId,
				type: "job-bound",
				scope: "roblox",
			})
				.sort({ createdAt: -1 })
				.limit(100)
				.exec(),
			Request.find({
				type: "global",
				scope: "roblox",
			})
				.sort({ createdAt: -1 })
				.limit(100)
				.exec(),
		])
		const stripRequest = (request) => ({
			request: request.request,
			createdAt: request.createdAt,
		})
		responseData.requests = [].concat(requests.map(stripRequest), globalRequests.map(stripRequest))
	} else {
		return new Response("Forbidden", { status: 403 })
	}

	return new Response(JSON.stringify(responseData), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	})
}
