import { useId } from "react";
import "./GeometricHeaderBackground.css";

/** Edge-weighted geometry traced in the reference's Home/Profile proportions. */
export function GeometricHeaderBackground({
  variant,
}: {
  variant: "home" | "profile";
}) {
  const id = `header-${useId().replace(/:/g, "")}`;
  const isHome = variant === "home";
  const height = isHome ? 276 : 520;

  return (
    <div className="geometric-header-background" aria-hidden="true">
      <svg
        data-header-background={variant}
        viewBox={`0 0 740 ${height}`}
        preserveAspectRatio="xMidYMax slice"
        focusable="false"
      >
        <defs>
          <linearGradient id={`${id}-base`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={isHome ? "#340805" : "#510E0C"} />
            <stop offset="0.56" stopColor={isHome ? "#4A0C09" : "#5B1411"} />
            <stop offset="1" stopColor={isHome ? "#601611" : "#440B08"} />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="0" cy="1" r="1">
            <stop stopColor="#AA302B" stopOpacity="0.28" />
            <stop offset="0.72" stopColor="#AA302B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-orb`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#B47877" stopOpacity="0.48" />
            <stop offset="1" stopColor="#8E3032" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={`${id}-veil`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#9E3D3E" stopOpacity="0.18" />
            <stop offset="1" stopColor="#A13B3B" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id={`${id}-line`} x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#DC5149" stopOpacity="0.26" />
            <stop offset="0.48" stopColor="#F49A84" stopOpacity="0.9" />
            <stop offset="1" stopColor="#D94A42" stopOpacity="0.16" />
          </linearGradient>
          <pattern id={`${id}-dots`} width="18.5" height="20.5" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="2.25" fill="#B94D49" />
          </pattern>
          <pattern id={`${id}-dust`} width="17" height="19" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="0.9" fill="#AD4A43" />
          </pattern>
        </defs>

        <path d={`M0 0H740V${height}H0Z`} fill={`url(#${id}-base)`} />
        <path d={`M0 0H740V${height}H0Z`} fill={`url(#${id}-glow)`} />

        {isHome ? (
          <>
            <g className="geometric-header-background__sweep">
              <path
                d="M-70-40H528C401 56 273 185 156 248C55 301-44 307-70 305Z"
                fill="#240403"
                opacity="0.32"
              />
              <path
                d="M-48 99C-7 211 66 269 201 286"
                fill="none"
                stroke="#C8443C"
                strokeOpacity="0.5"
                strokeWidth="0.65"
                vectorEffect="non-scaling-stroke"
              />
            </g>
            <g className="geometric-header-background__outer-orb">
              <circle cx="662" cy="311" r="211" fill={`url(#${id}-veil)`} />
            </g>
            <g className="geometric-header-background__inner-orb">
              <circle cx="642" cy="326" r="140" fill={`url(#${id}-orb)`} />
            </g>
            <g className="geometric-header-background__lines" fill="none" strokeWidth="0.65">
              <path
                d="M45 292C203 265 288 103 503 94C599 90 689 98 786 129"
                stroke={`url(#${id}-line)`}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M448 312C451 164 500 64 611-14"
                stroke="#E16459"
                strokeOpacity="0.76"
                vectorEffect="non-scaling-stroke"
              />
            </g>
            <g className="geometric-header-background__dots">
              <path d="M16 24H65V109H16Z" fill={`url(#${id}-dust)`} opacity="0.09" />
            </g>
          </>
        ) : (
          <>
            <g className="geometric-header-background__sweep">
              <circle cx="-13" cy="241" r="195" fill={`url(#${id}-veil)`} />
              <path
                d="M-62 140C91 164 176 304 204 455L216 548H-62Z"
                fill={`url(#${id}-veil)`}
              />
            </g>
            <g className="geometric-header-background__outer-orb">
              <circle cx="667" cy="53" r="169" fill={`url(#${id}-orb)`} />
              <circle cx="770" cy="388" r="268" fill={`url(#${id}-veil)`} />
            </g>
            <g className="geometric-header-background__inner-orb">
              <circle cx="-175" cy="441" r="335" fill={`url(#${id}-veil)`} />
              <circle cx="750" cy="679" r="260" fill={`url(#${id}-orb)`} />
            </g>
            <g className="geometric-header-background__lines" fill="none" strokeWidth="0.65">
              <path
                d="M-36 218C97 232 200 381 146 535"
                stroke={`url(#${id}-line)`}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M-41 147C103 129 217 0 310-29"
                stroke="#D9574E"
                strokeOpacity="0.62"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M458 546C512 398 611 284 775 245"
                stroke={`url(#${id}-line)`}
                vectorEffect="non-scaling-stroke"
              />
            </g>
            <g className="geometric-header-background__dots">
              <path d="M631 336H717V429H631Z" fill={`url(#${id}-dots)`} opacity="0.62" />
              <path d="M19 32H68V348H19Z" fill={`url(#${id}-dust)`} opacity="0.12" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
