import { getApiKey, ApiKey } from "../../shared/mongoose.mjs"

export async function POST({ request }) {
	// create key
	// skip for now. i don't have an API key at zhis moment!
	// const apiKey = await getApiKey(request.headers.get("Authorization")).catch(() => null)
	// if (!apiKey) {
	// 	return new Response("Unauthorized", { status: 401 })
	// }

	const responseData = {}
	if (true /* apiKey.accessTypes.includes("write") */) {
		// parse body
		const body = await request.json().catch(() => null)
		if (!body) {
			return new Response("Invalid request body", { status: 400 })
		}

		const newKey = body.key
		const accessTypes = body.accessTypes || []
		const description = body.description || ""

		// create new API key
		const apiKey = new ApiKey({
			key: newKey,
			accessTypes: accessTypes,
			description: description,
		})

		try {
			await apiKey.save()
			responseData.key = apiKey.key
			responseData.accessTypes = apiKey.accessTypes
			responseData.description = apiKey.description
			responseData.createdAt = apiKey.createdAt
		} catch (error) {
			return new Response("Error creating API key", { status: 500 })
		}

		return new Response(JSON.stringify(responseData), {
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
			},
			status: 201,
		})
	} else {
		return new Response("Forbidden", { status: 403 })
	}
}
