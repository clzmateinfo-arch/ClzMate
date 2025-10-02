export default function AsidePanel({
    image,
    lines = [],
    cite = "",
    overlay = true,
    className = "",
}) {
    const overlayStyles = overlay ? "before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-20" : "";

    return (
        <aside
            className={`relative hidden lg:block h-full p-16 bg-center bg-cover ${className}`}
            style={{
                backgroundImage: image ? `url(${image})` : undefined,
                backgroundColor: "rgba(0,0,0,0.01)",
                backgroundBlendMode: "overlay"
            }}
            aria-hidden={false}
        >
            <div className={`relative z-10 text-purple-900`}>
                <blockquote className="text-2xl font-heading leading-tight">
                    {lines.map((l, i) => (
                        <p className="leading-tight text-[#f9d8ff]" key={i}>
                            {l}
                        </p>
                    ))}
                    {cite && (
                        <cite className="block not-italic text-xl mt-6 text-[#f9d8ff]">
                            <span className="opacity-40">-</span>
                            {cite}
                        </cite>
                    )}
                </blockquote>
            </div>

            {overlay && <div className="absolute inset-0 bg-white opacity-20 pointer-events-none" />}
        </aside>
    );
}
