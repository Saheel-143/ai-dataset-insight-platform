"""
Database Service with Dual-Mode Support:
- Local SQLite / JSON file database (default, zero credentials, zero setup)
- Amazon DynamoDB (AWS mode for production cloud deployment)
"""
import os
import json
import sqlite3
import datetime
from typing import List, Optional, Dict, Any

class DatabaseService:
    def __init__(self):
        self.mode = os.environ.get("DB_MODE", "local").lower()
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        os.makedirs(self.base_dir, exist_ok=True)
        self.db_path = os.path.join(self.base_dir, "metadata.db")

        self.dynamodb = None
        self.datasets_table_name = os.environ.get("DYNAMODB_DATASETS_TABLE", "ai_platform_datasets")
        self.chats_table_name = os.environ.get("DYNAMODB_CHATS_TABLE", "ai_platform_chats")
        self.users_table_name = os.environ.get("DYNAMODB_USERS_TABLE", "ai_platform_users")

        if self.mode == "dynamodb":
            try:
                import boto3
                self.dynamodb = boto3.resource("dynamodb")
            except Exception as e:
                print(f"[DatabaseService] DynamoDB init failed: {e}. Falling back to SQLite.")
                self.mode = "local"

        self._init_local_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_local_db(self):
        """Initializes SQLite schema for local metadata storage"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Users table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TEXT NOT NULL
            )
            """)
            # Datasets table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                row_count INTEGER NOT NULL,
                col_count INTEGER NOT NULL,
                missing_total INTEGER NOT NULL,
                duplicate_rows INTEGER NOT NULL,
                is_cleaned INTEGER DEFAULT 0,
                source_dataset_id TEXT,
                storage_key TEXT NOT NULL,
                quality_score REAL DEFAULT 100.0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """)
            # Chat history table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_message TEXT NOT NULL,
                reply TEXT NOT NULL,
                intent TEXT,
                computed_value TEXT,
                chart_json TEXT,
                created_at TEXT NOT NULL
            )
            """)
            conn.commit()

    # --- Dataset Operations ---
    def save_dataset(self, meta: Dict[str, Any]) -> Dict[str, Any]:
        if self.mode == "dynamodb" and self.dynamodb:
            table = self.dynamodb.Table(self.datasets_table_name)
            item = dict(meta)
            # DynamoDB doesn't like float NaN
            for k, v in item.items():
                if isinstance(v, float) and (v != v):
                    item[k] = 0.0
            table.put_item(Item=item)
            return meta
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT OR REPLACE INTO datasets (
                    id, user_id, name, filename, file_type, size_bytes,
                    row_count, col_count, missing_total, duplicate_rows,
                    is_cleaned, source_dataset_id, storage_key, quality_score,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    meta["id"], meta["user_id"], meta["name"], meta["filename"],
                    meta["file_type"], meta["size_bytes"], meta["row_count"],
                    meta["col_count"], meta["missing_total"], meta["duplicate_rows"],
                    1 if meta.get("is_cleaned") else 0, meta.get("source_dataset_id"),
                    meta["storage_key"], meta.get("quality_score", 100.0),
                    meta["created_at"], meta["updated_at"]
                ))
                conn.commit()
            return meta

    def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        if self.mode == "dynamodb" and self.dynamodb:
            table = self.dynamodb.Table(self.datasets_table_name)
            resp = table.get_item(Key={"id": dataset_id})
            return resp.get("Item")
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
                row = cursor.fetchone()
                if row:
                    d = dict(row)
                    d["is_cleaned"] = bool(d["is_cleaned"])
                    return d
                return None

    def list_user_datasets(self, user_id: str) -> List[Dict[str, Any]]:
        if self.mode == "dynamodb" and self.dynamodb:
            table = self.dynamodb.Table(self.datasets_table_name)
            from boto3.dynamodb.conditions import Key, Attr
            resp = table.scan(FilterExpression=Attr("user_id").eq(user_id))
            return sorted(resp.get("Items", []), key=lambda x: x.get("created_at", ""), reverse=True)
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM datasets WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
                rows = cursor.fetchall()
                results = []
                for r in rows:
                    d = dict(r)
                    d["is_cleaned"] = bool(d["is_cleaned"])
                    results.append(d)
                return results

    def delete_dataset(self, dataset_id: str, user_id: str) -> bool:
        if self.mode == "dynamodb" and self.dynamodb:
            table = self.dynamodb.Table(self.datasets_table_name)
            table.delete_item(Key={"id": dataset_id})
            return True
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM datasets WHERE id = ? AND user_id = ?", (dataset_id, user_id))
                cursor.execute("DELETE FROM chat_messages WHERE dataset_id = ?", (dataset_id,))
                conn.commit()
            return True

    # --- Chat Operations ---
    def save_chat_message(self, chat_data: Dict[str, Any]) -> Dict[str, Any]:
        if self.mode == "dynamodb" and self.dynamodb:
            table = self.dynamodb.Table(self.chats_table_name)
            item = dict(chat_data)
            table.put_item(Item=item)
            return chat_data
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO chat_messages (
                    id, conversation_id, dataset_id, user_id, user_message,
                    reply, intent, computed_value, chart_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    chat_data["id"],
                    chat_data["conversation_id"],
                    chat_data["dataset_id"],
                    chat_data.get("user_id", "default_user"),
                    chat_data["user_message"],
                    chat_data["reply"],
                    chat_data.get("intent", ""),
                    str(chat_data.get("computed_value", "")) if chat_data.get("computed_value") is not None else None,
                    json.dumps(chat_data.get("chart")) if chat_data.get("chart") else None,
                    chat_data["created_at"]
                ))
                conn.commit()
            return chat_data

    def get_chat_history(self, dataset_id: str, conversation_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.mode == "dynamodb" and self.dynamodb:
            table = self.dynamodb.Table(self.chats_table_name)
            from boto3.dynamodb.conditions import Attr
            expr = Attr("dataset_id").eq(dataset_id)
            if conversation_id:
                expr = expr & Attr("conversation_id").eq(conversation_id)
            resp = table.scan(FilterExpression=expr)
            items = resp.get("Items", [])
            return sorted(items, key=lambda x: x.get("created_at", ""))
        else:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                if conversation_id:
                    cursor.execute("""
                    SELECT * FROM chat_messages 
                    WHERE dataset_id = ? AND conversation_id = ? 
                    ORDER BY created_at ASC
                    """, (dataset_id, conversation_id))
                else:
                    cursor.execute("""
                    SELECT * FROM chat_messages 
                    WHERE dataset_id = ? 
                    ORDER BY created_at ASC
                    """, (dataset_id,))
                rows = cursor.fetchall()
                results = []
                for r in rows:
                    item = dict(r)
                    if item.get("chart_json"):
                        try:
                            item["chart"] = json.loads(item["chart_json"])
                        except Exception:
                            item["chart"] = None
                    else:
                        item["chart"] = None
                    results.append(item)
                return results

    def clear_chat_history(self, dataset_id: str, conversation_id: Optional[str] = None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if conversation_id:
                cursor.execute("DELETE FROM chat_messages WHERE dataset_id = ? AND conversation_id = ?", (dataset_id, conversation_id))
            else:
                cursor.execute("DELETE FROM chat_messages WHERE dataset_id = ?", (dataset_id,))
            conn.commit()

    # --- User Operations ---
    def save_user(self, user_dict: Dict[str, Any]) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO users (id, email, name, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_dict["id"], user_dict["email"], user_dict["name"],
                user_dict["password_hash"], user_dict.get("role", "user"),
                user_dict["created_at"]
            ))
            conn.commit()
        return user_dict

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

# Global singleton
db_service = DatabaseService()

