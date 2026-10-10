"""
Docker action adapter — executes safe, allowlisted actions against real containers.

Key guarantee: missing containers and Docker errors NEVER return True.
The caller must handle the (False, error_message) result explicitly.
"""

import docker
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

ALLOWED_ACTIONS = {"pause_container", "unpause_container", "stop_container"}


class DockerAdapter:
    def __init__(self):
        try:
            self.client = docker.from_env()
            # Quick connectivity check
            self.client.ping()
            self.available = True
            logger.info("Docker adapter: connected to Docker daemon")
        except Exception as e:
            logger.warning(f"Docker not available: {e}. Remediation will be disabled.")
            self.client = None
            self.available = False

    async def execute_action_safe(
        self, action: str, container_name: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Execute a safe allowlisted Docker action.

        Returns:
            (True, None)          — action executed successfully
            (False, error_msg)    — action failed; error_msg describes why

        Explicitly NEVER returns (True, ...) when:
        - Docker is unavailable
        - The container does not exist
        - The action is not in the allowlist
        - An exception occurs during execution
        """
        if not self.available or self.client is None:
            return False, "Docker daemon is not available on this machine"

        if action not in ALLOWED_ACTIONS:
            return False, f"Action '{action}' is not in the approved allowlist: {ALLOWED_ACTIONS}"

        try:
            container = self.client.containers.get(container_name)
        except docker.errors.NotFound:
            return False, f"Container '{container_name}' not found. Cannot execute action."
        except Exception as e:
            return False, f"Docker error finding container '{container_name}': {e}"

        try:
            if action == "pause_container":
                container.pause()
            elif action == "unpause_container":
                container.unpause()
            elif action == "stop_container":
                container.stop(timeout=10)
            logger.info(f"Docker action '{action}' completed on '{container_name}'")
            return True, None
        except Exception as e:
            return False, f"Docker action '{action}' on '{container_name}' raised: {e}"


docker_adapter = DockerAdapter()
