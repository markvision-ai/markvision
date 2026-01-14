"use client";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import React, { useState, createContext, useContext, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate, isMobileOpen, setIsMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({ 
  className, 
  children 
}: { 
  className?: string; 
  children?: React.ReactNode 
}) => {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const { open, setOpen, animate } = useSidebar();
  
  return (
    <motion.aside
      className={cn(
        "h-screen px-4 py-4 hidden md:flex md:flex-col flex-shrink-0 sticky top-0",
        "bg-sidebar border-r border-border/30",
        className
      )}
      animate={{
        width: animate ? (open ? 280 : 64) : 280,
      }}
      initial={{
        width: animate ? 64 : 280,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </motion.aside>
  );
};

export const MobileSidebar = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  
  return (
    <>
      {/* Mobile Header with Burger */}
      <div className="h-14 px-4 flex md:hidden items-center justify-between bg-sidebar border-b border-border/30 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">MarkVision</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-sidebar-muted transition-colors"
        >
          <Menu className="w-6 h-6 text-sidebar-foreground" />
        </button>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent 
          side="left" 
          className={cn(
            "w-[300px] p-0 bg-sidebar border-r border-border/50",
            className
          )}
        >
          <div className="flex flex-col h-full overflow-y-auto">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  isActive = false,
  ...props
}: {
  link: Links;
  className?: string;
  isActive?: boolean;
  props?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
}) => {
  const { open, animate, setIsMobileOpen } = useSidebar();

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
    }
    // Close mobile sidebar on navigation
    setIsMobileOpen(false);
  }, [link, setIsMobileOpen]);

  return (
    <Link
      to={link.href}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-start gap-3 group/sidebar py-2.5 px-3 rounded-xl transition-all duration-200",
        isActive 
          ? "bg-primary/15 text-primary border border-primary/30" 
          : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      <div className={cn(
        "flex-shrink-0 transition-colors duration-200",
        isActive ? "text-primary" : "text-muted-foreground group-hover/sidebar:text-foreground"
      )}>
        {link.icon}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sm font-medium whitespace-pre transition-colors duration-200",
          isActive ? "text-primary" : "text-foreground/80 group-hover/sidebar:text-foreground"
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const SidebarLabel = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => {
  const { open, animate } = useSidebar();

  return (
    <motion.span
      animate={{
        display: animate ? (open ? "inline-block" : "none") : "inline-block",
        opacity: animate ? (open ? 1 : 0) : 1,
      }}
      className={cn(
        "text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-2 mt-6 first:mt-4",
        className
      )}
    >
      {label}
    </motion.span>
  );
};