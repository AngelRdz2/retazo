import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            src="/images/logo-icon.png"
            alt="Retazo"
            {...props}
            className={`object-contain ${props.className ?? ''}`}
        />
    );
}
