import * as React from 'react';

type LinkProps = {
    href: string;
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
};

export default function Link({ href, children, ...props }: LinkProps) {
    return <a href={typeof href === 'string' ? href : String(href)} {...props}>{children}</a>;
}