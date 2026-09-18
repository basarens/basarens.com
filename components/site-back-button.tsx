import Link from "next/link";

type SiteBackButtonProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function SiteBackButton({
  href = "/",
  label = "Terug naar basarens.com",
  className = "",
}: SiteBackButtonProps) {
  return (
    <Link
      aria-label={label}
      className={`inline-flex min-h-10 items-center gap-2 rounded-2xl bg-[#bbdff3] px-3.5 py-2 text-sm font-semibold tracking-[-0.05em] text-[#023a4f] shadow-[4px_5px_0_#075879] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-[#d5effb] hover:shadow-[5px_7px_0_#075879] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#075879] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_3px_0_#075879] ${className}`}
      href={href}
    >
      <span aria-hidden="true">←</span>
      <span>
        bas arens<span className="text-[#ff6c37]">.</span>
      </span>
    </Link>
  );
}
