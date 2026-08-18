"""
Demo file for SonarQube teaching — Python
Contains intentional: Bugs, Vulnerabilities, Code Smells, Security Hotspots
"""

import os
import sqlite3
import hashlib
import pickle
import subprocess

# ============================================================
# VULNERABILITY 1: Hardcoded credentials (Security Hotspot)
# SonarQube Rule: python:S2068
# ============================================================
DB_PASSWORD = "admin123"
SECRET_KEY  = "hardcoded_secret_key_12345"
API_TOKEN   = "ghp_abc123supersecrettoken"


# ============================================================
# VULNERABILITY 2: SQL Injection
# SonarQube Rule: python:S3649
# ============================================================
def get_user(username):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # VULNERABLE: user input directly in SQL query
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    cursor.execute(query)
    return cursor.fetchall()


# ============================================================
# VULNERABILITY 3: Command Injection
# SonarQube Rule: python:S2076
# ============================================================
def run_ping(host):
    # VULNERABLE: shell=True with user input
    result = subprocess.run("ping -c 1 " + host, shell=True, capture_output=True)
    return result.stdout


# ============================================================
# VULNERABILITY 4: Weak hashing algorithm (MD5)
# SonarQube Rule: python:S4790
# ============================================================
def hash_password(password):
    # VULNERABLE: MD5 is cryptographically broken
    return hashlib.md5(password.encode()).hexdigest()


# ============================================================
# VULNERABILITY 5: Insecure deserialization
# SonarQube Rule: python:S5135
# ============================================================
def load_user_data(data):
    # VULNERABLE: pickle.loads on untrusted data
    return pickle.loads(data)


# ============================================================
# BUG 1: Resource leak — file never closed
# SonarQube Rule: python:S2095
# ============================================================
def read_config():
    f = open("config.txt", "r")   # BUG: never closed
    content = f.read()
    return content


# ============================================================
# BUG 2: Division by zero not handled
# SonarQube Rule: python:S2190
# ============================================================
def calculate_average(values):
    total = sum(values)
    count = len(values)
    return total / count   # BUG: crashes if values is empty []


# ============================================================
# BUG 3: Infinite loop — missing break/exit condition
# SonarQube Rule: python:S2189
# ============================================================
def wait_for_response():
    while True:
        pass   # BUG: no exit condition, infinite loop


# ============================================================
# BUG 4: Comparison to None using == instead of is
# SonarQube Rule: python:S4426
# ============================================================
def check_value(val):
    if val == None:   # BUG: should use 'is None'
        return "empty"
    return val


# ============================================================
# CODE SMELL 1: Too many parameters (Long Parameter List)
# SonarQube Rule: python:S107
# ============================================================
def create_user(first_name, last_name, email, password,
                age, address, city, country, phone, role):
    pass   # SMELL: too many parameters, use a class or dict


# ============================================================
# CODE SMELL 2: Dead code — function never called
# SonarQube Rule: python:S1144
# ============================================================
def unused_helper_function():
    x = 10
    y = 20
    return x + y   # SMELL: never called anywhere


# ============================================================
# CODE SMELL 3: Duplicated code blocks
# SonarQube Rule: common-java:DuplicatedBlocks
# ============================================================
def process_admin(user):
    print("Validating...")
    print("Loading permissions...")
    print("Connecting to DB...")
    print("Done")

def process_guest(user):
    print("Validating...")
    print("Loading permissions...")
    print("Connecting to DB...")
    print("Done")   # SMELL: exact duplicate of process_admin


# ============================================================
# CODE SMELL 4: Magic numbers
# SonarQube Rule: python:S109
# ============================================================
def calculate_discount(price):
    return price * 0.15   # SMELL: magic number 0.15, use a named constant


# ============================================================
# CODE SMELL 5: Empty except block (swallowed exception)
# SonarQube Rule: python:S110
# ============================================================
def connect_to_db():
    try:
        conn = sqlite3.connect("app.db")
        return conn
    except:
        pass   # SMELL: silently swallows ALL exceptions


# ============================================================
# CODE SMELL 6: Variable declared but never used
# SonarQube Rule: python:S1481
# ============================================================
def compute_total(items):
    unused_var = []          # SMELL: assigned but never read
    total = sum(items)
    return total


# ============================================================
# SECURITY HOTSPOT: Use of os.environ without validation
# SonarQube Rule: python:S5247
# ============================================================
def get_admin_path():
    # HOTSPOT: environment variable used directly without sanitisation
    base_path = os.environ.get("ADMIN_PATH", "/admin")
    return base_path
