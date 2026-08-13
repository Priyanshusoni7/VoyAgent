// Simple animated skeleton block — use it anywhere as a loading placeholder
// Just pass a className to control width, height, and shape
export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-[#ede9e3] rounded-xl ${className}`}
    />
  );
}
