export function ContentContainer({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {children}
    </div>
  )
}
