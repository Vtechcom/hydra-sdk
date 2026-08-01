import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
	[
		'inline-flex items-center justify-center gap-1 shrink-0 w-fit',
		'rounded-md border px-1.5 py-0.5',
		'text-xs font-medium whitespace-nowrap',
		'transition-colors overflow-hidden',
		"[&>svg]:pointer-events-none [&>svg:not([class*='size-'])]:size-3"
	].join(' '),
	{
		variants: {
			variant: {
				default: 'border-transparent bg-primary text-primary-foreground',
				secondary: 'border-transparent bg-secondary text-secondary-foreground',
				outline: 'border-border text-foreground',
				muted: 'border-transparent bg-muted text-muted-foreground',
				success: 'border-transparent bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300',
				warning: 'border-transparent bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300',
				destructive: 'border-transparent bg-error-100 text-error-800 dark:bg-error-900/40 dark:text-error-300',
				/** Asset chips inside a UTxO row — quiet until hovered. */
				asset: 'border-border/70 bg-muted/60 text-muted-foreground font-mono hover:border-primary/50 hover:text-foreground'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	}
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
