function PaginationButton({
  page,
  isActive,
  onClick,
}: Readonly<{ page: number | null; isActive?: boolean; onClick?: (p: number) => void }>) {
  if (page === null)
    return <span aria-hidden="true" className="w-10 h-10 rounded-lg border border-transparent opacity-0" />
  return (
    <button
      onClick={() => onClick?.(page)}
      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
        isActive ? "bg-rose-700 text-white" : "text-gray-800 bg-white border border-gray-300 hover:bg-gray-50"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {page}
    </button>
  )
}

export default PaginationButton
