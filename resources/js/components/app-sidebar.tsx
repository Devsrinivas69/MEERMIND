import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    Compass,
    LayoutGrid,
    PlusCircle,
    QrCode,
    Ticket,
    Sparkles,
    BarChart3,
    UserCheck,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { Auth, NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

    const mainNavItems: NavItem[] = [
        {
            title: 'Explore Events',
            href: '/events',
            icon: Compass,
        },
    ];

    if (!isOrganizer) {
        mainNavItems.push({
            title: 'My Tickets',
            href: '/attendee/tickets',
            icon: Ticket,
        });
    }

    if (isOrganizer) {
        mainNavItems.push(
            {
                title: 'Analytics Overview',
                href: '/organizer/dashboard',
                icon: BarChart3,
            },
            {
                title: 'My Events',
                href: '/organizer/events',
                icon: Calendar,
            },
            {
                title: 'Review Applications',
                href: '/organizer/registrations',
                icon: UserCheck,
            },
            {
                title: 'Create Event',
                href: '/organizer/events/create',
                icon: PlusCircle,
            },
            {
                title: 'QR Check-In Scanner',
                href: '/organizer/check-in',
                icon: QrCode,
            }
        );
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" prefetch>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold text-foreground">MeetMind AI</span>
                                    <span className="truncate text-xs text-muted-foreground capitalize">{user?.role || 'Platform'}</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
