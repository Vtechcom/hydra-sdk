import axios from 'axios'

export const useBlockfrostApi = () => {
	const blockfrostApiKey = `preprodP1y4jQEKTV5a7eGoGGgr6cCGhOkEcmFw`
	const blockfrostUrl = 'https://cardano-preprod.blockfrost.io/api/v0'
	const axiosInstance = axios.create({
		baseURL: blockfrostUrl,
		withCredentials: false,
		timeout: 300000,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			project_id: blockfrostApiKey
		}
	})
	axiosInstance.interceptors.request.use(request => {
		console.log(
			`[Develop debugger] Proxy request:\n`,
			`ENDPOINT: ${request.baseURL} \n`,
			`TO: ${request.url}\n`,
			`METHOD: ${request.method}\n`,
			`BODY: `,
			request.data
		)
		return request
	})
	axiosInstance.interceptors.response.use(
		response => {
			return response.data
		},
		async error => {
			console.log('>>> / error:', error.message)
			return Promise.reject(error.response)
		}
	)

	return axiosInstance
}
