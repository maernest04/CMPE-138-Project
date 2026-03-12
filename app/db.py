"""
MySQL connection helper for Senior Capstone Viewer.
Uses mysql-connector-python. Configure via environment or defaults for local dev.
"""
import os
import mysql.connector
from mysql.connector import Error


def get_db_config():
    """Read DB config from environment or use local defaults."""
    return {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "port": int(os.getenv("MYSQL_PORT", "3306")),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", ""),
        "database": os.getenv("MYSQL_DATABASE", "senior_capstone_viewer"),
        "autocommit": True,
    }


def get_connection():
    """Return a new MySQL connection. Caller must close it."""
    try:
        return mysql.connector.connect(**get_db_config())
    except Error as e:
        raise RuntimeError(f"Database connection failed: {e}") from e


def execute_query(query: str, params: tuple | None = None, fetch: bool = True):
    """
    Run a single query and optionally return results.
    Uses a new connection each time (fine for small app). For many requests, consider a pool.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params or ())
        if fetch:
            return cursor.fetchall()
        else:
            conn.commit()
    finally:
        conn.close()
