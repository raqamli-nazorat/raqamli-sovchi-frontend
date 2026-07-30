import React from 'react';

// Hugeicons va Lucide elementlarining ichki tipi
export type IconElement = [
    tag: keyof React.JSX.IntrinsicElements,
    attrs: Record<string, any>
];

export interface HugeIconProps {
    icon: any;
    size?: number | string;
    strokeWidth?: number | string;
    className?: string;
}

export const HugeIcon: React.FC<HugeIconProps> = ({
    icon,
    size = 16,
    strokeWidth = 2,
    className = "",
}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        className={className}
    >
        {(icon as IconElement[]).map(([tag, attrs]: IconElement, index: number) => {
            const Tag = tag as any;
            const { key, ...rest } = attrs;

            return (
                <Tag
                    key={key || index}
                    {...rest}
                    strokeWidth={strokeWidth}
                />
            );
        })}
    </svg>
);