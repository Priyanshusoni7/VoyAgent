// Reusable input field with optional left icon and right element
export default function Input({
  label,
  id,
  icon: Icon,
  rightElement,
  className = "",
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#1a1714]">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute left-3.5 text-[#7a6f65] pointer-events-none">
            <Icon size={16} />
          </span>
        )}

        <input
          id={id}
          className={`
            w-full bg-white border border-[#e8e2d8] rounded-xl
            text-sm text-[#1a1714] placeholder-[#b8b0a6]
            px-4 py-3
            ${Icon ? "pl-10" : ""}
            ${rightElement ? "pr-10" : ""}
            focus:outline-none focus:border-[#d4603a] focus:ring-2 focus:ring-[#d4603a]/15
            transition-all duration-150
            ${className}
          `}
          {...props}
        />

        {rightElement && (
          <span className="absolute right-3.5">{rightElement}</span>
        )}
      </div>
    </div>
  );
}
