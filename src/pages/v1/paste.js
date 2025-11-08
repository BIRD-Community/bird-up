// @ts-check
import { Paste, getApiKey } from "../../shared/mongoose.mjs"

export async function POST({ request }) {
	const apiKey = await getApiKey(request.headers.get("Authorization")).catch(() => null)
	if (!apiKey) return new Response("Unauthorized", { status: 401 })
	if (!apiKey.accessTypes.includes("write")) return new Response("Forbidden", { status: 403 })

	const body = await request.json().catch(() => null)
	if (!body) return new Response("Invalid request body", { status: 400 })
	const data = body.data
	if (!data) return new Response("Data field is required", { status: 400 })

	const pasteDocument = new Paste({ data })
	await pasteDocument.save()

	return new Response(JSON.stringify({
		key: pasteDocument.key,
	}), {
		status: 201,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	})
}
/*
Example GET request:

fetch('https://yourdomain.com/v1/paste?key=yourpastekey')

Example POST request:

fetch('https://yourdomain.com/v1/paste', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'your_api_key'
	},
	body: JSON.stringify({
		data: 'Your paste content here'
	})
})

*/

export async function GET({ request }) {
	const queryParams = Object.fromEntries(new URL(request.url).searchParams.entries())
	const key = queryParams.key
	if (!key) return new Response("Key field is required", { status: 400 })

	const paste = await Paste.findOne({ key: key }).catch(() => null)
	if (!paste) return new Response("Paste not found. This could be that it never existed or it had expired.", { status: 404 })
	const data = paste.data
	return new Response(data, {
		status: 200,
		headers: {
			"Content-Type": "text/plain",
			"Cache-Control": "no-cache",
			"Last-Modified": paste.createdAt.toUTCString(),
			"Expires": paste.expiresAt.toUTCString(),
		},
	})
}
