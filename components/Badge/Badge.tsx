type BadgeVariant = 'green' | 'gray' | 'amber' | 'yellow' | 'blue';

type BadgeProps = {
    variant: BadgeVariant;
    text: string;
    soft?: boolean;
};

const variantClasses: Record<BadgeVariant, string> = {
    green: 'bg-green-100 text-green-700',
    gray: 'bg-gray-100 text-gray-500',
    amber: 'bg-amber-100 text-amber-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
};

const softVariantClasses: Record<BadgeVariant, string> = {
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-100 text-gray-500',
    amber: 'bg-amber-100 text-amber-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
};

export default function Badge({ variant, text, soft = false }: BadgeProps) {
    const classes = soft
        ? `text-xs px-2 py-0.5 rounded-full ${softVariantClasses[variant]}`
        : `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`;
    return (
        <span className={classes}>
            {text}
        </span>
    );
}
