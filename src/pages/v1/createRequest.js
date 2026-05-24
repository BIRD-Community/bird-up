import { getApiKey, Request } from "../../shared/mongoose.mjs"

export async function POST({ request }) {
	const apiKey = await getApiKey(request.headers.get("Authorization")).catch(() => null)
	if (!apiKey) {
		return new Response("Unauthorized", { status: 401 })
	}

	if (apiKey.accessTypes.includes("write")) {
		// parse body
		const body = await request.json().catch(() => null)
		if (!body) return new Response("Invalid request body", { status: 400 })
		if (!body.request) return new Response("Request field is required", { status: 400 })

		const requestDocument = new Request(body)
		await requestDocument.save().catch(() => {
			return new Response("Error creating request", { status: 500 })
		})
		return new Response(JSON.stringify({ message: "Request created" }), {
			status: 201,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
			},
		})
	} else {
		return new Response("Forbidden", { status: 403 })
	}
}
