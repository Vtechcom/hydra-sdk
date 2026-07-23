/**
 * Bridge a host unix domain socket to a TCP endpoint.
 *
 * Why this exists
 * ---------------
 * When cardano-node runs in Docker Desktop on macOS, its `node.socket` is
 * bind-mounted to the host — but only the *inode* crosses the VM boundary.
 * Connecting to it from the host fails with ECONNREFUSED, because the listening
 * end lives inside the Linux VM. hydra-node runs natively on the host (the
 * official image is amd64-only and its embedded etcd crashes under emulation on
 * arm64), so it cannot reach the socket directly.
 *
 * The fix is two hops:
 *
 *   hydra-node ──▶ host UDS ──▶ [this script] ──▶ TCP ──▶ [socat container] ──▶ node.socket
 *
 * The container hop is `alpine/socat`; see bridge-up.sh. This half is plain Node
 * so there is nothing to install on the host.
 *
 *   node socket-bridge.mjs [--socket PATH] [--host HOST] [--port PORT]
 */
import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'

const arg = (name, fallback) => {
	const i = process.argv.indexOf(`--${name}`)
	return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const SOCKET = arg('socket', '/tmp/cardano-node-preprod.socket')
const HOST = arg('host', '127.0.0.1')
const PORT = Number(arg('port', 3001))

// A stale socket file from a previous run would make listen() throw EADDRINUSE.
fs.rmSync(SOCKET, { force: true })
fs.mkdirSync(path.dirname(SOCKET), { recursive: true })

const server = net.createServer(client => {
	const upstream = net.connect(PORT, HOST)

	// Either side going away must tear down the other, or hydra-node is left
	// holding a half-open connection and stalls instead of reconnecting.
	const close = () => {
		client.destroy()
		upstream.destroy()
	}
	client.on('error', close)
	upstream.on('error', close)
	client.on('close', close)
	upstream.on('close', close)

	client.pipe(upstream)
	upstream.pipe(client)
})

server.on('error', err => {
	console.error(`[socket-bridge] ${err.message}`)
	process.exit(1)
})

server.listen(SOCKET, () => {
	fs.chmodSync(SOCKET, 0o777)
	console.log(`[socket-bridge] ${SOCKET} -> ${HOST}:${PORT}`)
})

const shutdown = () => {
	server.close()
	fs.rmSync(SOCKET, { force: true })
	process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
