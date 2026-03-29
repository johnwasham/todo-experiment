from fastapi.testclient import TestClient

VALID_PAYLOAD = {"name": "Buy groceries"}
FULL_PAYLOAD = {"name": "Buy groceries", "priority": 2, "due_date": "2026-12-31"}


def test_create_todo_minimal(client: TestClient) -> None:
    response = client.post("/todos", json=VALID_PAYLOAD)
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Buy groceries"
    assert body["done"] is False
    assert body["priority"] is None
    assert body["due_date"] is None
    assert "id" in body
    assert "created_at" in body
    assert "updated_at" in body


def test_create_todo_full(client: TestClient) -> None:
    response = client.post("/todos", json=FULL_PAYLOAD)
    assert response.status_code == 201
    body = response.json()
    assert body["priority"] == 2
    assert body["due_date"] == "2026-12-31"


def test_create_todo_blank_name(client: TestClient) -> None:
    response = client.post("/todos", json={"name": "   "})
    assert response.status_code == 422


def test_create_todo_missing_name(client: TestClient) -> None:
    response = client.post("/todos", json={})
    assert response.status_code == 422


def test_create_todo_invalid_priority(client: TestClient) -> None:
    response = client.post("/todos", json={"name": "Test", "priority": 5})
    assert response.status_code == 422


def test_list_todos(client: TestClient) -> None:
    client.post("/todos", json={"name": "First"})
    client.post("/todos", json={"name": "Second"})
    response = client.get("/todos")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_update_todo_mark_done(client: TestClient) -> None:
    todo_id = client.post("/todos", json=VALID_PAYLOAD).json()["id"]
    response = client.patch(f"/todos/{todo_id}", json={"done": True})
    assert response.status_code == 200
    assert response.json()["done"] is True


def test_update_todo_rename(client: TestClient) -> None:
    todo_id = client.post("/todos", json=VALID_PAYLOAD).json()["id"]
    response = client.patch(f"/todos/{todo_id}", json={"name": "Renamed"})
    assert response.status_code == 200
    assert response.json()["name"] == "Renamed"


def test_update_todo_not_found(client: TestClient) -> None:
    response = client.patch("/todos/9999", json={"done": True})
    assert response.status_code == 404


def test_delete_todo(client: TestClient) -> None:
    todo_id = client.post("/todos", json=VALID_PAYLOAD).json()["id"]
    response = client.delete(f"/todos/{todo_id}")
    assert response.status_code == 204


def test_delete_todo_not_found(client: TestClient) -> None:
    response = client.delete("/todos/9999")
    assert response.status_code == 404
