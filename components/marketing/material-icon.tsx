export function MaterialIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`material-symbols-rounded ${className}`}>
      {name}
    </span>
  );
}
