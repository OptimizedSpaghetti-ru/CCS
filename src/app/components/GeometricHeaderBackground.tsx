import { useId } from "react";
import "./GeometricHeaderBackground.css";

/** Edge-weighted geometry traced in the reference's Home/Profile proportions. */
export function GeometricHeaderBackground({
  variant,
  dark = false,
}: {
  variant: "home" | "profile";
  dark?: boolean;
}) {
  const id = `header-${useId().replace(/:/g, "")}`;
  const isHome = variant === "home";
  const height = isHome ? 276 : 520;

  if (isHome && dark) return <DarkHomeBackground id={id} />;

  return (
    <div className={`geometric-header-background${dark ? " geometric-header-background--dark-profile" : ""}`} aria-hidden="true">
      <svg
        data-header-background={dark ? `${variant}-dark` : variant}
        viewBox={`0 0 740 ${height}`}
        preserveAspectRatio={dark ? "none" : "xMidYMax slice"}
        focusable="false"
      >
        <defs>
          <linearGradient id={`${id}-base`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={dark ? "#35070C" : isHome ? "#340805" : "#510E0C"} />
            <stop offset="0.56" stopColor={dark ? "#220205" : isHome ? "#4A0C09" : "#5B1411"} />
            <stop offset="1" stopColor={dark ? "#170104" : isHome ? "#601611" : "#440B08"} />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="0" cy="1" r="1">
            <stop stopColor="#AA302B" stopOpacity={dark ? "0.09" : "0.28"} />
            <stop offset="0.72" stopColor="#AA302B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-orb`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={dark ? "#A44551" : "#B47877"} stopOpacity={dark ? "0.32" : "0.48"} />
            <stop offset="1" stopColor={dark ? "#6C1828" : "#8E3032"} stopOpacity={dark ? "0.08" : "0.18"} />
          </linearGradient>
          <linearGradient id={`${id}-veil`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#9E3D3E" stopOpacity="0.18" />
            <stop offset="1" stopColor="#A13B3B" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id={`${id}-line`} x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#DC5149" stopOpacity="0.26" />
            <stop offset="0.48" stopColor={dark ? "#FFADB6" : "#F49A84"} stopOpacity="0.9" />
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

/** Reference Home artwork, independent of account role and header content. */
function DarkHomeBackground({ id }: { id: string }) {
  return (
    <div className="geometric-header-background geometric-header-background--dark-home" aria-hidden="true">
      <svg data-header-background="home-dark" viewBox="0 0 1110 334" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id={`${id}-dark-base`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#3B080E" />
            <stop offset="0.48" stopColor="#220205" />
            <stop offset="0.76" stopColor="#170104" />
            <stop offset="1" stopColor="#34070C" />
          </linearGradient>
          <linearGradient id={`${id}-dark-circle`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#A44551" stopOpacity="0.32" />
            <stop offset="1" stopColor="#6C1828" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id={`${id}-dark-left`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#6C1525" stopOpacity="0.12" />
            <stop offset="1" stopColor="#210104" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={`${id}-dark-line`} x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#D33750" stopOpacity="0.2" />
            <stop offset="0.25" stopColor="#F38D9D" stopOpacity="0.9" />
            <stop offset="0.48" stopColor="#C72A44" stopOpacity="0.55" />
            <stop offset="0.76" stopColor="#FFADB6" stopOpacity="0.95" />
            <stop offset="1" stopColor="#D23B51" stopOpacity="0.38" />
          </linearGradient>
          <pattern id={`${id}-dark-dots`} width="25" height="24" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="2.6" fill="#B92B45" />
          </pattern>
        </defs>
        <path d="M0 0H1110V334H0Z" fill={`url(#${id}-dark-base)`} />
        <g className="geometric-header-background__sweep">
          <circle cx="62" cy="147" r="240" fill={`url(#${id}-dark-left)`} />
          <path d="M-35 206C174 310 267 378 414 296L456 380H-35Z" fill={`url(#${id}-dark-circle)`} opacity="0.8" />
        </g>
        <g className="geometric-header-background__outer-orb">
          <circle cx="1000" cy="164" r="262" fill={`url(#${id}-dark-circle)`} />
          <circle cx="1114" cy="38" r="168" fill={`url(#${id}-dark-circle)`} opacity="0.82" />
        </g>
        <g className="geometric-header-background__inner-orb">
          <ellipse cx="845" cy="480" rx="382" ry="318" fill={`url(#${id}-dark-circle)`} />
        </g>
        <g className="geometric-header-background__lines" fill="none" stroke={`url(#${id}-dark-line)`} strokeWidth="0.7">
          <path d="M-35 180C149 189 292 130 455-18" vectorEffect="non-scaling-stroke" />
          <path d="M-30 210C174 310 297 403 470 247C613 118 678 58 849-18" vectorEffect="non-scaling-stroke" />
          <path d="M664 355C826 244 932 224 1140 268" vectorEffect="non-scaling-stroke" />
        </g>
        <g className="geometric-header-background__dots">
          <path d="M995 242H1110V334H995Z" fill={`url(#${id}-dark-dots)`} opacity="0.55" />
        </g>
      </svg>
    </div>
  );
}
