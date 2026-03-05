import BottomTabBar from "@/components/layout/BottomTabBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-24">
      {children}
      <BottomTabBar />
    </div>
  );
}
