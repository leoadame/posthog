from typing import Dict, Optional

from posthog.hogql import ast
from posthog.hogql.errors import HogQLException
from posthog.hogql.visitor import CloningVisitor


def replace_placeholders(node: ast.Expr, placeholders: Optional[Dict[str, ast.Expr]]) -> ast.Expr:
    """If `placeholders` is None, this means placeholders are not supported and will cause an error."""
    return ReplacePlaceholders(placeholders).visit(node)


class ReplacePlaceholders(CloningVisitor):
    def __init__(self, placeholders: Optional[Dict[str, ast.Expr]]):
        """If `placeholders` is None, this means placeholders are not supported and will cause an error."""
        super().__init__()
        self.placeholders = placeholders

    def visit_placeholder(self, node):
        if self.placeholders is None:
            raise HogQLException(f"Placeholders, such as '{node.field}', are not supported in this context")
        if node.field in self.placeholders:
            new_node = self.placeholders[node.field]
            new_node.start = node.start
            new_node.end = node.end
            return new_node
        raise HogQLException(
            f"The following placeholders are available here: "
            + ", ".join((f"{placeholder}" for placeholder in self.placeholders))
            + f". '{node.field}' is not one of them."
        )
