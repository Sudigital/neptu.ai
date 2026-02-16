import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

const GITHUB_URL = "https://github.com/nicholassu/neptu.ai";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Neptu",
    },
    githubUrl: GITHUB_URL,
  };
}
