import { CSSProperties } from 'react'

export function HogIcon({ style }: { style?: CSSProperties }): JSX.Element {
    return (
        <svg
            className="hog-icon"
            style={style}
            fill="none"
            width="206"
            height="120"
            viewBox="0 0 206 120"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="m.0001297 85.7151 34.3310703 34.2849h-34.3310703zm0-8.5712 42.9137703 42.8561h34.3311l-77.2448703-77.141zm0-42.8561 85.8275703 85.7122h34.3313l-120.1588703-119.99711609zm42.9137703 0 85.8281 85.7122v-34.2849l-85.8281-85.71221609zm42.9138-34.28491609v34.28491609l42.9143 42.8561v-34.2849z"
                fill="#f9bd2b"
            />
            <path
                clipRule="evenodd"
                d="m182.545 96.5876c6.214 6.2054 14.645 9.6954 23.441 9.6954v13.714h-71.175v-71.0792zm-20.269 2.8389c0 3.7865-3.074 6.8565-6.866 6.8565s-6.866-3.07-6.866-6.8565c0-3.787 3.074-6.857 6.866-6.857s6.866 3.07 6.866 6.857z"
                fill="#000"
                fillRule="evenodd"
            />
            <g fill="#1d4aff">
                <path d="m0 119.997h34.331l-34.331-34.2844z" />
                <path d="m42.9138 42.859-42.91377711-42.85611609v34.28491609l42.91377711 42.8561z" />
                <path d="m0 42.8563v34.2849l42.9138 42.8558v-34.2846z" />
            </g>
            <path d="m85.8305 42.8562-42.9138-42.8562v34.2849l42.9138 42.8562z" fill="#f54e00" />
            <path d="m42.9133 119.998h34.331l-34.331-34.2852z" fill="#f54e00" />
            <path d="m42.9133 42.8564v34.2849l42.9138 42.8557v-34.2844z" fill="#f54e00" />
        </svg>
    )
}
