"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LogOut, Menu, MessageCircle, Sparkles, User as UserIcon, Users } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { useSignOut } from "@/providers/auth-provider";
import { useChatNotificationsStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCurrentProfile } from "@/hooks/use-profile";

const navLinks = [
  { href: "/matches", label: "Discover", icon: Sparkles },
  { href: "/matches/list", label: "Matches", icon: Users },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

function formatBadgeCount(count: number) {
  return count > 9 ? "9+" : String(count);
}

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const signOut = useSignOut();
  const pathname = usePathname();
  const { data: profile } = useCurrentProfile();
  const unreadCount = useChatNotificationsStore((state) => state.unreadCount);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full brand-gradient text-primary-foreground">
            <Flame className="size-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">Arova</span>
        </Link>

        {user && (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const showBadge = link.href === "/chat" && unreadCount > 0;
              return (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="relative"
                >
                  <Link href={link.href} className="gap-1.5">
                    <link.icon className="size-4" />
                    {link.label}
                    {showBadge && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1.5 -right-1.5 h-4.5 min-w-4.5 justify-center rounded-full px-1 text-[10px] leading-none"
                      >
                        {formatBadgeCount(unreadCount)}
                      </Badge>
                    )}
                  </Link>
                </Button>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex cursor-pointer items-center gap-1">
                      <div className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
                        <Avatar>
                          <AvatarImage src={profile?.avatar_url} alt={profile?.full_name ?? "You"} />
                          <AvatarFallback>
                            {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col items-start">
                        <p className="text-sm font-semibold">{profile?.full_name}</p>
                        <p className="text-xs font-medium">{profile?.email}</p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/profile">
                        <UserIcon />
                        My profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => signOut()}
                      className="cursor-pointer"
                    >
                      <LogOut />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative md:hidden">
                    <Menu />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4.5 min-w-4.5 justify-center rounded-full px-1 text-[10px] leading-none"
                      >
                        {formatBadgeCount(unreadCount)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Avatar className="size-9">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name ?? "You"} />
                        <AvatarFallback>
                          {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      {profile?.full_name ?? "Your account"}
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 px-3">
                    {navLinks.map((link) => {
                      const showBadge = link.href === "/chat" && unreadCount > 0;
                      return (
                        <Button
                          key={link.href}
                          asChild
                          variant={pathname === link.href ? "secondary" : "ghost"}
                          className="justify-start"
                        >
                          <Link href={link.href}>
                            <link.icon />
                            {link.label}
                            {showBadge && (
                              <Badge variant="destructive" className="ml-auto rounded-full px-1.5">
                                {formatBadgeCount(unreadCount)}
                              </Badge>
                            )}
                          </Link>
                        </Button>
                      );
                    })}
                    <Button
                      variant="ghost"
                      className="justify-start text-destructive hover:text-destructive"
                      onClick={() => signOut()}
                    >
                      <LogOut />
                      Sign out
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}