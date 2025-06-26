import { TrackedServer } from "../../shared/mongoose.mjs"

export async function GET({ params, request }) {
	const output = {}
	const servers = await TrackedServer.aggregate([
		{
			$match: {
				lastHeartbeat: { $gt: new Date(Date.now() - 1000 * 20) },
			},
		},
		{
			$group: {
				_id: "$data.placeId",
				playerCount: { $sum: "$data.playerCount" },
			},
		},
		{ $limit: 200 },
	])

	servers.forEach((server) => {
		output[server._id] = server.playerCount
	})

	return new Response(JSON.stringify(output), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	})
}
