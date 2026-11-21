
from collections import defaultdict, deque
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


app = FastAPI(title="CrimeGraph Graph Service")


class GraphNode(BaseModel):
    id: str
    label: Optional[str] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship_type: Optional[str] = None
    confidence: Optional[float] = None


class GraphRequest(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class PathRequest(GraphRequest):
    start_id: str
    end_id: str


def build_graph(data):
    graph = defaultdict(list)

    node_ids = {node.id for node in data.nodes}

    for node_id in node_ids:
        graph[node_id]

    for edge in data.edges:
        if edge.source not in node_ids or edge.target not in node_ids:
            continue

        graph[edge.source].append(edge.target)
        graph[edge.target].append(edge.source)

    return graph, node_ids


@app.get("/health")
def health():
    return {
        "success": True,
        "message": "CrimeGraph Graph Service is running"
    }


@app.post("/api/graph/analyze")
def analyze_graph(data: GraphRequest):
    graph, node_ids = build_graph(data)

    connections = {
        node_id: len(graph[node_id])
        for node_id in node_ids
    }

    visited = set()
    components = []

    for node_id in node_ids:
        if node_id in visited:
            continue

        queue = [node_id]
        visited.add(node_id)
        component = []

        while queue:
            current = queue.pop(0)
            component.append(current)

            for neighbor in graph[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        components.append(component)

    return {
        "success": True,
        "node_count": len(node_ids),
        "edge_count": len(data.edges),
        "connections": connections,
        "connected_groups": components,
        "connected_group_count": len(components)
    }


@app.post("/api/graph/shortest-path")
def shortest_path(data: PathRequest):
    graph, node_ids = build_graph(data)

    if data.start_id not in node_ids or data.end_id not in node_ids:
        raise HTTPException(
            status_code=404,
            detail="Start or end entity was not found"
        )

    queue = deque([[data.start_id]])
    visited = {data.start_id}

    while queue:
        path = queue.popleft()
        current = path[-1]

        if current == data.end_id:
            return {
                "success": True,
                "path": path,
                "distance": len(path) - 1
            }

        for neighbor in graph[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(path + [neighbor])

    return {
        "success": True,
        "path": [],
        "distance": None,
        "message": "No connection found between these entities"
    }
