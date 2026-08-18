CREATE DATABASE IF NOT EXISTS appdb;
CReATE DATABASEW RAVI;
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'apppassword';
GRANT ALL PRIVILEGES ON appdb.* TO 'appuser'@'%';
FLUSH PRIVILEGES;

USE appdb;

CREATE TABLE IF NOT EXISTS notes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  text       VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notes (text) VALUES
  ('GitHub Actions pipeline is working! 🚀'),
  ('Docker image pushed to DockerHub ✅'),
  ('Deployed to EC2 successfully 🎉');
