import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

const DynamicSidebarTrigger = () => {
  const { open } = useSidebar();
  
  return (
    <header className={`fixed top-4 z-50 transition-all duration-200 ${
      open ? 'left-64 ml-4' : 'left-4'
    }`}>
      <SidebarTrigger className="bg-background shadow-md" />
    </header>
  );
};

export default DynamicSidebarTrigger;
