import pytest
from pathlib import Path

from app.service.source_service import (
    resolve_safe_path,
    build_file_tree,
    parse_ini_inventory,
    parse_yaml_inventory,
    detect_and_parse_inventory,
)


class TestResolveSafePath:
    def test_valid_relative_path(self, tmp_path):
        (tmp_path / "playbook.yml").touch()
        result = resolve_safe_path(str(tmp_path), "playbook.yml")
        assert result == tmp_path / "playbook.yml"

    def test_nested_path(self, tmp_path):
        (tmp_path / "sub").mkdir()
        (tmp_path / "sub" / "file.yml").touch()
        result = resolve_safe_path(str(tmp_path), "sub/file.yml")
        assert result == tmp_path / "sub" / "file.yml"

    def test_traversal_blocked(self, tmp_path):
        with pytest.raises(ValueError, match="outside source directory"):
            resolve_safe_path(str(tmp_path), "../etc/passwd")

    def test_absolute_path_blocked(self, tmp_path):
        with pytest.raises(ValueError, match="outside source directory"):
            resolve_safe_path(str(tmp_path), "/etc/passwd")


class TestBuildFileTree:
    def test_empty_dir(self, tmp_path):
        tree = build_file_tree(str(tmp_path))
        assert tree["name"] == tmp_path.name
        assert tree["type"] == "directory"
        assert tree["children"] == []

    def test_files_and_dirs(self, tmp_path):
        (tmp_path / "playbook.yml").write_text("---")
        (tmp_path / "inventory").mkdir()
        (tmp_path / "inventory" / "hosts").write_text("[all]")

        tree = build_file_tree(str(tmp_path))
        names = {c["name"] for c in tree["children"]}
        assert "playbook.yml" in names
        assert "inventory" in names

        inv = next(c for c in tree["children"] if c["name"] == "inventory")
        assert inv["type"] == "directory"
        assert any(c["name"] == "hosts" for c in inv["children"])

    def test_subdirectory_only(self, tmp_path):
        (tmp_path / "a").mkdir()
        (tmp_path / "a" / "b.txt").write_text("hello")
        (tmp_path / "c.txt").write_text("world")

        tree = build_file_tree(str(tmp_path), subpath="a")
        assert tree["name"] == "a"
        assert len(tree["children"]) == 1
        assert tree["children"][0]["name"] == "b.txt"


class TestParseIniInventory:
    def test_simple_hosts(self, tmp_path):
        hosts_file = tmp_path / "hosts"
        hosts_file.write_text(
            "[webservers]\n"
            "web1.example.com\n"
            "web2.example.com\n"
            "\n"
            "[dbservers]\n"
            "db1.example.com\n"
        )
        result = parse_ini_inventory(str(hosts_file))
        group_names = {g["name"] for g in result["groups"]}
        assert "webservers" in group_names
        assert "dbservers" in group_names

        web_group = next(g for g in result["groups"] if g["name"] == "webservers")
        assert len(web_group["hosts"]) == 2
        assert web_group["hosts"][0]["name"] == "web1.example.com"

    def test_host_with_vars(self, tmp_path):
        hosts_file = tmp_path / "hosts"
        hosts_file.write_text(
            "[web]\n"
            "server1 ansible_host=10.0.0.1 ansible_port=2222\n"
        )
        result = parse_ini_inventory(str(hosts_file))
        host = result["groups"][0]["hosts"][0]
        assert host["name"] == "server1"
        assert host["vars"]["ansible_host"] == "10.0.0.1"
        assert host["vars"]["ansible_port"] == "2222"

    def test_children_group(self, tmp_path):
        hosts_file = tmp_path / "hosts"
        hosts_file.write_text(
            "[web]\n"
            "web1\n"
            "\n"
            "[db]\n"
            "db1\n"
            "\n"
            "[all_servers:children]\n"
            "web\n"
            "db\n"
        )
        result = parse_ini_inventory(str(hosts_file))
        parent = next(g for g in result["groups"] if g["name"] == "all_servers")
        assert set(parent["children"]) == {"web", "db"}
        assert len(parent["hosts"]) == 0


class TestParseYamlInventory:
    def test_yaml_inventory(self, tmp_path):
        inv_file = tmp_path / "inventory.yml"
        inv_file.write_text(
            "all:\n"
            "  children:\n"
            "    webservers:\n"
            "      hosts:\n"
            "        web1.example.com:\n"
            "        web2.example.com:\n"
            "    dbservers:\n"
            "      hosts:\n"
            "        db1.example.com:\n"
        )
        result = parse_yaml_inventory(str(inv_file))
        group_names = {g["name"] for g in result["groups"]}
        assert "all" in group_names
        assert "webservers" in group_names

        web_group = next(g for g in result["groups"] if g["name"] == "webservers")
        assert len(web_group["hosts"]) == 2


class TestDetectAndParseInventory:
    def test_detects_inventory_dir(self, tmp_path):
        inv_dir = tmp_path / "inventory"
        inv_dir.mkdir()
        (inv_dir / "hosts").write_text("[web]\nweb1\n")

        result = detect_and_parse_inventory(str(tmp_path))
        assert len(result["groups"]) > 0

    def test_detects_hosts_file(self, tmp_path):
        (tmp_path / "hosts").write_text("[db]\ndb1\n")

        result = detect_and_parse_inventory(str(tmp_path))
        assert len(result["groups"]) > 0

    def test_no_inventory_found(self, tmp_path):
        result = detect_and_parse_inventory(str(tmp_path))
        assert result["groups"] == []
