import type { LucideIcon } from "lucide-react";
import {
  Braces,
  Container,
  File,
  FileCode,
  FileCode2,
  FileCog,
  FileText,
  GitBranch,
  Hammer,
  Image,
  KeyRound,
  Lock,
  Package,
  Scale,
  Settings,
  Table,
  Terminal,
} from "lucide-react";

interface IconResult {
  icon: LucideIcon;
  colorClass: string;
}

const EXT_ICONS: Record<string, IconResult> = {
  // YAML — playbooks, tasks, vars, etc.
  ".yml": { icon: FileCode, colorClass: "text-primary" },
  ".yaml": { icon: FileCode, colorClass: "text-primary" },

  // Jinja2 templates
  ".j2": { icon: FileCog, colorClass: "text-orange-400" },
  ".jinja2": { icon: FileCog, colorClass: "text-orange-400" },
  ".jinja": { icon: FileCog, colorClass: "text-orange-400" },

  // Python — custom modules, plugins, filters
  ".py": { icon: FileCode2, colorClass: "text-yellow-400" },

  // Shell scripts
  ".sh": { icon: Terminal, colorClass: "text-green-400" },
  ".bash": { icon: Terminal, colorClass: "text-green-400" },
  ".zsh": { icon: Terminal, colorClass: "text-green-400" },

  // Markdown / docs
  ".md": { icon: FileText, colorClass: "text-blue-400" },
  ".rst": { icon: FileText, colorClass: "text-blue-400" },

  // JSON
  ".json": { icon: Braces, colorClass: "text-yellow-500" },

  // Config files
  ".ini": { icon: Settings, colorClass: "text-muted-foreground" },
  ".cfg": { icon: Settings, colorClass: "text-muted-foreground" },
  ".conf": { icon: Settings, colorClass: "text-muted-foreground" },
  ".toml": { icon: Settings, colorClass: "text-muted-foreground" },
  ".env": { icon: Settings, colorClass: "text-muted-foreground" },

  // Certificates & keys
  ".pem": { icon: KeyRound, colorClass: "text-red-400" },
  ".key": { icon: KeyRound, colorClass: "text-red-400" },
  ".crt": { icon: KeyRound, colorClass: "text-red-400" },
  ".pub": { icon: KeyRound, colorClass: "text-red-400" },
  ".cert": { icon: KeyRound, colorClass: "text-red-400" },

  // Images
  ".png": { icon: Image, colorClass: "text-purple-400" },
  ".jpg": { icon: Image, colorClass: "text-purple-400" },
  ".jpeg": { icon: Image, colorClass: "text-purple-400" },
  ".gif": { icon: Image, colorClass: "text-purple-400" },
  ".svg": { icon: Image, colorClass: "text-purple-400" },
  ".ico": { icon: Image, colorClass: "text-purple-400" },

  // Data
  ".csv": { icon: Table, colorClass: "text-muted-foreground" },
  ".tsv": { icon: Table, colorClass: "text-muted-foreground" },

  // XML
  ".xml": { icon: FileCode, colorClass: "text-orange-300" },

  // Text
  ".txt": { icon: FileText, colorClass: "text-muted-foreground" },
  ".log": { icon: FileText, colorClass: "text-muted-foreground" },
};

/** Exact filename matches (case-insensitive lookup) */
const NAME_ICONS: Record<string, IconResult> = {
  dockerfile: { icon: Container, colorClass: "text-sky-400" },
  containerfile: { icon: Container, colorClass: "text-sky-400" },
  "docker-compose.yml": { icon: Container, colorClass: "text-sky-400" },
  "docker-compose.yaml": { icon: Container, colorClass: "text-sky-400" },
  makefile: { icon: Hammer, colorClass: "text-muted-foreground" },
  license: { icon: Scale, colorClass: "text-muted-foreground" },
  "license.md": { icon: Scale, colorClass: "text-muted-foreground" },
  "license.txt": { icon: Scale, colorClass: "text-muted-foreground" },
  copying: { icon: Scale, colorClass: "text-muted-foreground" },
  ".gitignore": { icon: GitBranch, colorClass: "text-muted-foreground" },
  ".gitattributes": { icon: GitBranch, colorClass: "text-muted-foreground" },
  ".gitmodules": { icon: GitBranch, colorClass: "text-muted-foreground" },
  "requirements.txt": { icon: Package, colorClass: "text-muted-foreground" },
  "requirements.yml": { icon: Package, colorClass: "text-muted-foreground" },
  "requirements.yaml": { icon: Package, colorClass: "text-muted-foreground" },
  "ansible.cfg": { icon: Settings, colorClass: "text-primary" },
  "galaxy.yml": { icon: Package, colorClass: "text-primary" },
  "galaxy.yaml": { icon: Package, colorClass: "text-primary" },
};

const DEFAULT_FILE: IconResult = {
  icon: File,
  colorClass: "text-muted-foreground",
};

export function getFileIcon(filename: string): IconResult {
  const lower = filename.toLowerCase();

  // 1. Exact filename match
  const byName = NAME_ICONS[lower];
  if (byName) return byName;

  // 2. Vault-encrypted files
  if (lower.includes("vault")) {
    return { icon: Lock, colorClass: "text-amber-400" };
  }

  // 3. Extension match
  const dotIdx = lower.lastIndexOf(".");
  if (dotIdx !== -1) {
    const ext = lower.slice(dotIdx);
    const byExt = EXT_ICONS[ext];
    if (byExt) return byExt;
  }

  return DEFAULT_FILE;
}
