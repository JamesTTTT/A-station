import os
import subprocess
import shutil
import logging
from pathlib import Path
from typing import Optional

import yaml

logger = logging.getLogger(__name__)


def resolve_safe_path(source_root: str, relative_path: str) -> Path:
    root = Path(source_root).resolve()
    target = (root / relative_path).resolve()
    if not str(target).startswith(str(root)):
        raise ValueError(f"Path resolves outside source directory: {relative_path}")
    return target


def build_file_tree(source_root: str, subpath: str = "") -> dict:
    root = Path(source_root)
    if subpath:
        root = resolve_safe_path(source_root, subpath)

    def _walk(path: Path) -> dict:
        node = {"name": path.name, "type": "directory" if path.is_dir() else "file"}
        if path.is_dir():
            children = sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name))
            node["children"] = [_walk(child) for child in children if not child.name.startswith(".")]
        return node

    return _walk(root)


def read_file_content(source_root: str, relative_path: str) -> str:
    path = resolve_safe_path(source_root, relative_path)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {relative_path}")
    return path.read_text()


# --- Git operations ---

def git_clone(url: str, target_path: str, branch: str = "main") -> None:
    Path(target_path).parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["git", "clone", "--branch", branch, "--single-branch", url, target_path],
        capture_output=True, text=True, timeout=300,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git clone failed: {result.stderr.strip()}")


def git_pull(source_path: str) -> str:
    result = subprocess.run(
        ["git", "-C", source_path, "pull"],
        capture_output=True, text=True, timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(f"git pull failed: {result.stderr.strip()}")
    return result.stdout.strip()


def remove_source_directory(source_path: str) -> None:
    path = Path(source_path)
    if path.exists():
        shutil.rmtree(path)


# --- Inventory parsing ---

def parse_ini_inventory(file_path: str) -> dict:
    groups = []
    current_group = None
    is_children_section = False

    with open(file_path) as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#") or line.startswith(";"):
                continue

            if line.startswith("[") and line.endswith("]"):
                header = line[1:-1]
                is_children_section = header.endswith(":children")
                group_name = header.split(":")[0] if ":" in header else header
                current_group = {"name": group_name, "hosts": [], "vars": {}, "children": []}
                groups.append(current_group)
                continue

            if current_group is None:
                continue

            if is_children_section:
                current_group["children"].append(line)
            else:
                parts = line.split(None, 1)
                hostname = parts[0]
                host_vars = {}
                if len(parts) > 1:
                    for pair in parts[1].split():
                        if "=" in pair:
                            k, v = pair.split("=", 1)
                            host_vars[k] = v
                current_group["hosts"].append({"name": hostname, "vars": host_vars})

    return {"groups": groups}


def parse_yaml_inventory(file_path: str) -> dict:
    with open(file_path) as f:
        data = yaml.safe_load(f)

    if not isinstance(data, dict):
        return {"groups": []}

    groups = []
    _parse_yaml_group(data, groups)
    return {"groups": groups}


def _parse_yaml_group(data: dict, groups: list, parent_name: str = None) -> None:
    for group_name, group_data in data.items():
        if not isinstance(group_data, dict):
            continue

        group = {"name": group_name, "hosts": [], "vars": {}, "children": []}

        hosts = group_data.get("hosts", {})
        if isinstance(hosts, dict):
            for host_name, host_vars in hosts.items():
                group["hosts"].append({
                    "name": host_name,
                    "vars": host_vars if isinstance(host_vars, dict) else {},
                })

        group_vars = group_data.get("vars", {})
        if isinstance(group_vars, dict):
            group["vars"] = group_vars

        children = group_data.get("children", {})
        if isinstance(children, dict):
            group["children"] = list(children.keys())
            _parse_yaml_group(children, groups, group_name)

        groups.append(group)


def detect_and_parse_inventory(source_root: str, path: Optional[str] = None) -> dict:
    root = Path(source_root)

    if path:
        target = resolve_safe_path(source_root, path)
        if target.is_dir():
            hosts_file = target / "hosts"
            if hosts_file.is_file():
                return parse_ini_inventory(str(hosts_file))
            for name in ["inventory.yml", "inventory.yaml"]:
                yml = target / name
                if yml.is_file():
                    return parse_yaml_inventory(str(yml))
            return {"groups": []}
        elif target.is_file():
            if target.suffix in (".yml", ".yaml"):
                return parse_yaml_inventory(str(target))
            return parse_ini_inventory(str(target))

    # Auto-detect
    search_order = [
        root / "inventory" / "hosts",
        root / "inventory.yml",
        root / "inventory.yaml",
        root / "hosts",
    ]
    for candidate in search_order:
        if candidate.is_file():
            if candidate.suffix in (".yml", ".yaml"):
                return parse_yaml_inventory(str(candidate))
            return parse_ini_inventory(str(candidate))

    # Check inventory/ directory for yaml files
    inv_dir = root / "inventory"
    if inv_dir.is_dir():
        for name in ["inventory.yml", "inventory.yaml", "hosts.yml", "hosts.yaml"]:
            candidate = inv_dir / name
            if candidate.is_file():
                return parse_yaml_inventory(str(candidate))

    return {"groups": []}
