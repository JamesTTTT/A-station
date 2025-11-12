import yaml
from fastapi import HTTPException

def validate_ansible_playbook(yaml_content: str) -> bool:
    """
    Validate Ansible playbook structure.
    Accepts:
    - List of plays (standard format)
    - Single play as dict
    - Plays with 'hosts' or 'import_playbook'/'include_playbook'
    """
    try:
        data = yaml.safe_load(yaml_content)

        # Handle None or empty content
        if data is None:
            raise ValueError("Playbook cannot be empty")

        # Convert single dict to list for uniform processing
        plays = [data] if isinstance(data, dict) else data

        # Must be a list after conversion
        if not isinstance(plays, list):
            raise ValueError("Playbook must be a list of plays or a single play dictionary")

        if len(plays) == 0:
            raise ValueError("Playbook must contain at least one play")

        # Validate each play
        for idx, play in enumerate(plays):
            if not isinstance(play, dict):
                raise ValueError(f"Play {idx + 1} must be a dictionary")

            # Valid play-level keys that don't require 'hosts'
            import_keys = ['import_playbook', 'include_playbook', 'import_tasks', 'include_tasks']
            has_import = any(key in play for key in import_keys)

            # A play must have either 'hosts' or one of the import keys
            if 'hosts' not in play and not has_import:
                raise ValueError(
                    f"Play {idx + 1} must have 'hosts' key or one of: {', '.join(import_keys)}"
                )

        return True

    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid playbook structure: {str(e)}")
