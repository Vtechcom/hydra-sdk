import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
	"inline-flex transition-all items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium  disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:cursor-pointer",
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
				destructive:
					'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
				outline:
					'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
				secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
				link: 'text-primary underline-offset-4 hover:underline',

				primary: 'bg-green-500 text-base font-medium text-white transition-colors hover:bg-green-600 shadow-xs',
				warning: 'bg-yellow-500 text-base font-medium text-white transition-colors hover:bg-yellow-600 shadow-xs',
				danger: 'bg-red-400 text-base font-medium text-white transition-colors hover:bg-red-600 shadow-xs',
				'outline-warning':
					'bg-yellow-50 text-base font-medium text-yellow-500 transition-colors hover:bg-yellow-100 shadow-xs border border-solid border-yellow-300',
				'outline-danger':
					'bg-red-100 text-base font-medium text-red-400 transition-colors hover:bg-red-200 shadow-xs border border-solid border-red-300',
				'outline-primary':
					'bg-green-100 text-base font-medium text-green-400 transition-colors hover:bg-green-200 shadow-xs border border-solid border-green-300'
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
				lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
				xl: 'h-14 rounded-[16px] px-4 has-[>svg]:px-5 text-base',
				icon: 'size-9',
				xs: 'h-6 rounded-md px-2 has-[>svg]:px-2.5 text-xs'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
