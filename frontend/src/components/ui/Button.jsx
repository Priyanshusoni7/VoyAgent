// Reusable primary button component
export default function Button({ children, loading, className = "", ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        w-full flex items-center justify-center gap-2
        bg-[#d4603a] hover:bg-[#bf5432] active:scale-[0.98]
        text-white font-semibold text-sm
        px-5 py-3 rounded-xl
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        shadow-sm hover:shadow-md shadow-[#d4603a]/20
        ${className}
      `}
    >
      {children}
    </button>
  );
}
