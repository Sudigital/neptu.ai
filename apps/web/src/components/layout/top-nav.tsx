import type { HTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Menu, ExternalLink } from "lucide-react";

type TopNavProps = HTMLAttributes<HTMLElement> & {
  links: {
    title: string;
    href: string;
    isActive: boolean;
    disabled?: boolean;
    external?: boolean;
  }[];
};

export function TopNav({ className, links, ...props }: TopNavProps) {
  return (
    <>
      <div className="lg:hidden">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="md:size-7">
              <Menu />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            {links.map(({ title, href, isActive, disabled, external }) => (
              <DropdownMenuItem key={`${title}-${href}`} asChild>
                {external ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1",
                      !isActive && "text-muted-foreground"
                    )}
                  >
                    {title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link
                    to={href}
                    className={!isActive ? "text-muted-foreground" : ""}
                    disabled={disabled}
                  >
                    {title}
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav
        className={cn(
          "hidden items-center space-x-4 lg:flex lg:space-x-4 xl:space-x-6",
          className
        )}
        {...props}
      >
        {links.map(({ title, href, isActive, disabled, external }) =>
          external ? (
            <a
              key={`${title}-${href}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
                !isActive && "text-muted-foreground"
              )}
            >
              {title}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <Link
              key={`${title}-${href}`}
              to={href}
              disabled={disabled}
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? "" : "text-muted-foreground"}`}
            >
              {title}
            </Link>
          )
        )}
      </nav>
    </>
  );
}
