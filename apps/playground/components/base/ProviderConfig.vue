<script lang="ts" setup>
	import { cn } from '~/lib/utils'
	import { toTypedSchema } from '@vee-validate/zod'
	import * as z from 'zod'
	import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
	import { useForm, type TypedSchema } from 'vee-validate'
	import { toast } from 'vue-sonner'

	const mainStore = useMainStore()
	const { network } = storeToRefs(mainStore)
	const providerStore = useProviderStore()
	const { blockfrostFormError } = storeToRefs(providerStore)
	const { blockfrostNetworkMap } = providerStore

	const blockfrostNetwork = computed(() => blockfrostNetworkMap[network.value])
	const placeholderApiKey = computed(() => `${blockfrostNetwork.value}___`)
	const formSchema = toTypedSchema(
		z.object({
			blockfrostApiKey: z
				.string()
				.min(2)
				.max(50)
				.refine(url => url.includes(blockfrostNetwork.value), {
					message: `Invalid network url: ${blockfrostNetwork.value}`
				}),
			blockfrostApiEndpoint: z
				.string()
				.url()
				.min(5)
				.max(100)
				.default(`https://cardano-${blockfrostNetwork.value}.blockfrost.io/api/v0`)
				.refine(url => url.includes(blockfrostNetwork.value), {
					message: `Invalid network API Key: ${blockfrostNetwork.value}`
				})
		})
	)

	const form = useForm({
		validationSchema: formSchema,
		name: 'providerConfig'
	})
	const { errors } = form

	type SchemaKeys<T> = T extends TypedSchema<any, infer Output> ? keyof Output : never
	type BlockfrostFormErrorKeys = SchemaKeys<typeof formSchema>

	const syncedErrors = new Proxy(blockfrostFormError.value, {
		get(target, prop: BlockfrostFormErrorKeys) {
			const formError = errors.value[prop]
			// Ưu tiên form error nếu có, không thì lấy từ store
			return formError || target[prop as BlockfrostFormErrorKeys] || ''
		},
		set(target, prop: BlockfrostFormErrorKeys, value) {
			// Set vào form
			form.setFieldError(prop, value)
			// Set vào store
			target[prop as BlockfrostFormErrorKeys] = value
			// Trigger reactivity của store
			blockfrostFormError.value = { ...target }
			return true
		}
	})

	watch(
		blockfrostNetwork,
		newNetwork => {
			form.setFieldValue('blockfrostApiEndpoint', `https://cardano-${newNetwork}.blockfrost.io/api/v0`)
			form.validate()
		},
		{ immediate: true }
	)

	watch(
		errors,
		newErrors => {
			// Đồng bộ lỗi từ form sang store
			;(blockfrostFormError.value as any) = { ...newErrors }
		},
		{ deep: true }
	)

	const submit = async () => {
		try {
			console.log('Submitting form...', form)
			const { valid, errors } = await form.validate()
			if (!valid) {
				if (errors.blockfrostApiKey) toast.error(errors.blockfrostApiKey)
				if (errors.blockfrostApiEndpoint) toast.error(errors.blockfrostApiEndpoint)
				return
			}

			form.handleSubmit(values => {
				toast.success('Blockfrost config updated!')
				providerStore.setBlockfrostConfig({
					apiKey: values.blockfrostApiKey,
					apiEndpoint: values.blockfrostApiEndpoint
				})
			})()
		} catch (err) {
			console.error(err)
			toast.error('Failed to update Blockfrost config. Please check your input.')
		}
	}

	onMounted(() => {
		console.log('Mounting ProviderConfig...')
		providerStore.blockfrostConfig.apiEndpoint && form.setFieldValue('blockfrostApiEndpoint', providerStore.blockfrostConfig.apiEndpoint)
		providerStore.blockfrostConfig.apiKey && form.setFieldValue('blockfrostApiKey', providerStore.blockfrostConfig.apiKey)
	})
</script>

<template>
	<BaseResizableCard :class="cn('shrink-0')" name="BaseProviderConfig">
		<template #collapsed>
			<div class="flex items-center justify-center h-full" :class="errors.blockfrostApiKey ? 'text-destructive' : ''">
				<Icon name="tabler:cloud-code" size="32" class="mr-1" />
				<span class="text-lg font-semibold">Provider Config</span>
				<Icon name="tabler:alert-circle" size="20" class="ml-1" v-if="errors.blockfrostApiKey" />
			</div>
		</template>
		<form @submit.prevent="submit">
			<div class="text-lg font-semibold flex items-center">
				<Icon name="tabler:cloud-code" size="20" class="mr-1" />
				Provider Configuration
			</div>
			<div class="">
				<span class="text-primary font-medium text-nowrap">
					<Icon name="tabler:box" size="16" class="-mb-0.5" />
					Blockfrost
				</span>
				<div class="pl-4">
					<FormField v-slot="{ componentField }" name="blockfrostApiEndpoint">
						<FormItem>
							<FormLabel> </FormLabel>
							<FormControl>
								<InputGroup>
									<InputGroupAddon>
										<InputGroupText>API Url</InputGroupText>
									</InputGroupAddon>
									<InputGroupInput autocomplete="off" placeholder="API URL" v-bind="componentField" />
								</InputGroup>
							</FormControl>
						</FormItem>
					</FormField>
					<FormField v-slot="{ componentField }" name="blockfrostApiKey">
						<FormItem>
							<FormLabel> </FormLabel>
							<FormControl>
								<InputGroup :class="cn(errors.blockfrostApiKey ? 'border-destructive' : '')">
									<InputGroupAddon>
										<InputGroupText>API Key</InputGroupText>
									</InputGroupAddon>
									<InputGroupInput autocomplete="off" type="text" :placeholder="placeholderApiKey" v-bind="componentField" />
									<InputGroupAddon align="inline-end">
										<InputGroupButton variant="secondary"> Set </InputGroupButton>
									</InputGroupAddon>
								</InputGroup>
							</FormControl>
						</FormItem>
					</FormField>
				</div>
			</div>
		</form>
	</BaseResizableCard>
</template>

<style lang="scss" scoped></style>
