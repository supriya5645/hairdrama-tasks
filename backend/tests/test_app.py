import unittest
import json
from app import create_app

class TestHairdramaAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_root_endpoint(self):
        """Test root endpoint returns 200 and operational status."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "operational")

    def test_health_endpoint(self):
        """Test health check route returns healthy status."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "healthy")
        self.assertIn("database", data)
        self.assertIn("gmail_integration", data)

    def test_unauthenticated_tasks_access(self):
        """Protected endpoint /api/tasks must reject requests missing Bearer token."""
        response = self.client.get("/api/tasks")
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Unauthorized")

    def test_unauthenticated_users_access(self):
        """Protected endpoint /api/users must reject unauthenticated requests."""
        response = self.client.get("/api/users")
        self.assertEqual(response.status_code, 401)

if __name__ == "__main__":
    unittest.main()
