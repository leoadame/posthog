import ast
import re
from dataclasses import dataclass, field
from typing import List, Optional

from clickhouse_driver.util.escape import escape_param

from posthog.models.property.util import get_property_string_expr

EVENT_FIELDS = ["id", "uuid", "event", "timestamp", "distinct_id"]
PERSON_FIELDS = ["id", "created_at", "properties"]
CLICKHOUSE_FUNCTIONS = ["concat", "coalesce"]
HOGQL_AGGREGATIONS = ["avg", "sum", "total"]


@dataclass
class ExprParserContext:
    property_list: List[List[str]] = field(default_factory=list)
    encountered_nodes: List[ast.AST] = field(default_factory=list)
    is_aggregation: bool = False


def translate_hql(hql: str, context: Optional[ExprParserContext] = None) -> str:
    """Translate a HogQL expression into a Clickhouse expression."""
    try:
        # Until we swap out the AST parser, we're limited to Python's dialect.
        # This means "properties.$bla" fails. The following is a hack to get around that fofr now.
        hql = re.sub(r"properties\.(\$[\$a-zA-Z0-9_\-]+)", r"properties['\1']", hql)
        node = ast.parse(hql)
    except SyntaxError as err:
        raise ValueError(f"SyntaxError: {err.msg}")
    if not context:
        context = ExprParserContext()
    return translate_ast(node, [], context)


def translate_ast(node: ast.AST, stack: List[ast.AST], context: ExprParserContext) -> str:
    """Translate a parsed HogQL expression in the shape of a Python AST into a Clickhouse expression."""
    response = ""
    stack.append(node)
    context.encountered_nodes.append(node)
    if type(node) == ast.Module:
        if len(node.body) == 1 and type(node.body[0]) == ast.Expr:
            response = translate_ast(node.body[0], stack, context)
        else:
            raise ValueError(f"Module body must contain only one 'Expr'")
    elif type(node) == ast.Expr:
        ast.dump(node)
        response = translate_ast(node.value, stack, context)
    elif type(node) == ast.BinOp:
        if type(node.op) == ast.Add:
            response = f"plus({translate_ast(node.left, stack, context)}, {translate_ast(node.right, stack, context)})"
        elif type(node.op) == ast.Sub:
            response = f"minus({translate_ast(node.left, stack, context)}, {translate_ast(node.right, stack, context)})"
        elif type(node.op) == ast.Mult:
            response = (
                f"multiply({translate_ast(node.left, stack, context)}, {translate_ast(node.right, stack, context)})"
            )
        elif type(node.op) == ast.Div:
            response = (
                f"divide({translate_ast(node.left, stack, context)}, {translate_ast(node.right, stack, context)})"
            )
        else:
            response = f"({translate_ast(node.left, stack, context)} {translate_ast(node.op, stack, context)} {translate_ast(node.right, stack, context)})"
    elif type(node) == ast.UnaryOp:
        response = f"{translate_ast(node.op, stack, context)}{translate_ast(node.operand, stack, context)}"
    elif type(node) == ast.USub:
        response = "-"
    elif type(node) == ast.Constant:
        if type(node.value) == int or type(node.value) == float:
            response = str(node.value)
        elif type(node.value) == str or type(node.value) == list:
            response = escape_param(node.value)
        else:
            raise ValueError(f"Unknown AST Constant node type '{type(node.value)}' for value '{str(node.value)}'")
    elif type(node) == ast.Attribute or type(node) == ast.Subscript:
        attribute_chain: list[str] = []
        while True:
            if type(node) == ast.Attribute:
                attribute_chain.insert(0, node.attr)
                node = node.value
            elif type(node) == ast.Subscript:
                slice: ast.AST = node.slice
                if type(slice) == ast.Constant:
                    if type(slice.value) != str:
                        raise ValueError(f"Only string property access is currently supported, found '{slice.value}'")
                    attribute_chain.insert(0, slice.value)
                    node = node.value
                # ast.Index is a deprecated node class that shows up in tests with Python 3.8
                elif type(slice) == ast.Index and type(slice.value) == ast.Constant:  # type: ignore
                    const: ast.Constant = slice.value  # type: ignore
                    if type(const.value) != str:
                        raise ValueError(f"Only string property access is currently supported, found '{const.value}'")
                    attribute_chain.insert(0, const.value)
                    node = const
                else:
                    raise ValueError(f"Unsupported Subscript slice type: {type(node.slice).__name__}")
            elif type(node) == ast.Name:  # type: ignore
                attribute_chain.insert(0, node.id)
                break
            else:
                raise ValueError(f"Unknown node in field access chain: {ast.dump(node)}")
        response = property_access_to_clickhouse(attribute_chain)
        context.property_list.append(attribute_chain)

    elif type(node) == ast.Call:
        if type(node.func) != ast.Name:
            raise ValueError(f"Can only call simple functions like 'avg(properties.bla)' or 'total()'")
        call_name = node.func.id
        if call_name in HOGQL_AGGREGATIONS:
            context.is_aggregation = True
            if call_name == "total":
                if len(node.args) != 0:
                    raise ValueError(f"Method 'total' does not accept any arguments.")
                response = "count(*)"
            else:
                # check that there
                if len(node.args) != 1:
                    raise ValueError(f"Method '{call_name}' expects just one argument.")

                # check that we're not running inside another aggregate
                for stack_node in stack:
                    if (
                        stack_node != node
                        and type(stack_node) == ast.Call
                        and type(stack_node.func) == ast.Name
                        and stack_node.func.id in HOGQL_AGGREGATIONS
                    ):
                        raise ValueError(f"Method 'avg' cannot be nested inside another aggregate.")

                # check that we're running an aggregate on a property
                properties_before = len(context.property_list)
                response = f"{call_name}({translate_ast(node.args[0], stack, context)})"
                properties_after = len(context.property_list)
                if properties_after == properties_before:
                    raise ValueError(f"{call_name}(...) must be called on fields or properties, not literals.")

        elif node.func.id in CLICKHOUSE_FUNCTIONS:
            response = f"{node.func.id}({', '.join([translate_ast(arg, stack, context) for arg in node.args])})"
        else:
            raise ValueError(f"Unsupported function call '{call_name}(...)'")
    elif type(node) == ast.Name and type(node.id) == str:
        response = property_access_to_clickhouse([node.id])
        context.property_list.append([node.id])
    else:
        ast.dump(node)
        raise ValueError(f"Unknown AST type {type(node).__name__}")

    stack.pop()
    return response


def property_access_to_clickhouse(chain: List[str]):
    """Given a list like ['properties', '$browser'] or ['uuid'], translate to the correct ClickHouse expr."""
    if len(chain) == 2:
        if chain[0] == "properties":
            expression, _ = get_property_string_expr(
                "events",
                chain[1],
                escape_param(chain[1]),
                "properties",
            )
            return expression
        elif chain[0] == "person":
            if chain[1] in PERSON_FIELDS:
                return f"person_{chain[1]}"
            else:
                raise ValueError(f"Unknown person field '{chain[1]}'")
    elif len(chain) == 3 and chain[0] == "person" and chain[1] == "properties":
        expression, _ = get_property_string_expr(
            "events",
            chain[2],
            escape_param(chain[2]),
            "person_properties",
        )
        return expression
    elif len(chain) == 1:
        if chain[0] in EVENT_FIELDS:
            if chain[0] == "id":
                return "uuid"
            return chain[0]
        elif chain[0].startswith("person_") and chain[0][7:] in PERSON_FIELDS:
            return chain[0]
        else:
            raise ValueError(f"Unknown event field '{chain[0]}'")

    raise ValueError(f"Unsupported property access: {chain}")
