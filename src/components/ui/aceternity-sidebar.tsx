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
      {/* Desktop Sidebar only - hidden on mobile */}
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      {/* Mobile sidebar is handled by MobileMenuDrawer in AnalyticsPlatform */}
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
        "h-screen px-4 py-4 hidden md:flex md:flex-col flex-shrink-0 sticky top-0 left-0 z-50",
        "bg-sidebar border-r border-white/50",
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

// Mobile sidebar removed - handled by MobileMenuDrawer

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
        "relative flex items-center justify-start gap-3 group/sidebar py-2.5 px-3 rounded-xl transition-all duration-200",
        isActive
          ? "bg-[#955251]/10 text-[#955251] border border-[#955251]/30 shadow-[0_0_18px_rgba(149,82,81,0.25)] ring-1 ring-[#955251]/20"
          : "hover:bg-sidebar-muted text-sidebar-foreground/70 hover:text-sidebar-foreground",
        className
      )}
      {...props}
    >
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-[#955251] shadow-[0_0_20px_rgba(149,82,81,0.6)]" />
      )}
      <div className={cn(
        "flex-shrink-0 transition-colors duration-200",
        isActive ? "text-[#955251]" : "text-sidebar-foreground/70 group-hover/sidebar:text-sidebar-foreground"
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
          isActive ? "text-[#955251]" : "text-sidebar-foreground/80 group-hover/sidebar:text-sidebar-foreground"
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
        "text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 px-3 mb-2 mt-6 first:mt-4",
        className
      )}
    >
      {label}
    </motion.span>
  );
};
