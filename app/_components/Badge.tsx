import React from 'react';

interface BadgeProps {
    children: string;
}

export default function Badge({ children }: BadgeProps) {
    return (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {children}
        </div>
    );
}
