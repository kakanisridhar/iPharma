import clsx from "clsx";
import Logo from "@/components/common/logo";
export function Header() {
  return (
    <header
      className={clsx(
        "w-full fixed top-0 right-0 z-10 flex gap-4 px-4 py-4 transition-all duration-300",
      )}
    >
      <div className="flex-1 flex gap-4 items-center justify-between">
        <Logo />
      </div>
    </header>
  );
}
