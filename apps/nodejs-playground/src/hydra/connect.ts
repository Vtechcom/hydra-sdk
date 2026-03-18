import { HydraBridge } from '@hydra-sdk/bridge'
;(async () => {
	const url =
		'wss://uat-proxy.hydranode.io.vn/head/2e0ed03a-d626-4fde-ade6-ba9fcb844963?X-Api-Key=proj_691a7bc697bc4676a5ec8f69c44d7843&history=yes'

	const bridge = new HydraBridge({
		url: url,
		verbose: true
	})

	await bridge.connect()

	bridge.events.on('onConnected', () => {
		console.log('Connected to Hydra Node')
	})

	bridge.events.on('onDisconnected', () => {
		console.log('Disconnected from Hydra Node')
	})

	bridge.events.on('onMessage', message => {
		console.log('Message received:', message)
	})
})()
