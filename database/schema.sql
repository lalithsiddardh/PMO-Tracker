CREATE DATABASE IF NOT EXISTS fluentgrid_pmo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fluentgrid_pmo;

-- Users table
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN','ADMIN','PM','TESTER','BA','DEVELOPER','QA','DEVOPS','DESIGNER','OTHER') NOT NULL DEFAULT 'OTHER',
  status ENUM('PENDING_APPROVAL','ACTIVE','REJECTED','DISABLED') DEFAULT 'PENDING_APPROVAL',
  assigned_pm_id BIGINT NULL,
  created_by BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_pm_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Registration requests
CREATE TABLE registration_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  requested_role VARCHAR(50) NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  reviewed_by BIGINT NULL,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Project assignment history (PM change audit)
CREATE TABLE project_assignment_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  old_pm_id BIGINT NULL,
  new_pm_id BIGINT NOT NULL,
  changed_by BIGINT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (old_pm_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (new_pm_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Delete project requests (PM requests SUPER_ADMIN approval)
CREATE TABLE delete_project_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  requested_by BIGINT NOT NULL,
  requested_by_name VARCHAR(255) NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  reviewed_by BIGINT NULL,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications
CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Projects
CREATE TABLE projects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  bu VARCHAR(100) NOT NULL,
  type VARCHAR(100) NOT NULL,
  infra_managed_by VARCHAR(255) DEFAULT 'Client',
  spoc VARCHAR(255) NOT NULL,
  progress INT DEFAULT 0,
  status ENUM('ontrack','atrisk','delayed','onhold','pending','done') DEFAULT 'ontrack',
  start_date DATE NULL,
  end_date DATE NULL,
  team_size INT DEFAULT 0,
  budget DECIMAL(12,2) DEFAULT 0,
  created_by BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Project assignments (Admin -> PM mapping)
CREATE TABLE project_assignments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  pm_id BIGINT NOT NULL,
  assigned_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (pm_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (project_id, pm_id)
);

-- User-project assignments (for regular users)
CREATE TABLE user_project_assignments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  project_id BIGINT NOT NULL,
  assigned_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id, project_id)
);

-- Deliverables
CREATE TABLE deliverables (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM('external_vapt','internal_vapt','patch_mgmt','discom_audit','dpdp_audit','iso27001_audit','cloud_review','other') DEFAULT 'other',
  frequency ENUM('monthly','quarterly','halfyearly','annual','biennial','adhoc') DEFAULT 'annual',
  exec_type ENUM('internal','thirdparty') DEFAULT 'thirdparty',
  last_date DATE NULL,
  next_date DATE NULL,
  reminder_days INT DEFAULT 30,
  owner VARCHAR(255) DEFAULT NULL,
  scope TEXT,
  remarks TEXT,
  status ENUM('valid','due_soon','overdue','adhoc') DEFAULT 'valid',
  created_by BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Security tasks
CREATE TABLE security_tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  status ENUM('todo','in_progress','done') DEFAULT 'todo',
  severity ENUM('low','medium','high','crit') DEFAULT 'medium',
  assignee VARCHAR(255) DEFAULT NULL,
  start_date DATE NULL,
  due_date DATE NULL,
  completed_date DATE NULL,
  notes TEXT,
  created_by BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Vulnerabilities
CREATE TABLE vulnerabilities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cve VARCHAR(100) NOT NULL,
  asset VARCHAR(255) NOT NULL,
  severity ENUM('low','medium','high','crit') DEFAULT 'medium',
  cvss DECIMAL(3,1) NULL,
  status VARCHAR(50) DEFAULT 'open',
  discovered_date DATE NULL,
  remediation_date DATE NULL,
  owner VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Incidents
CREATE TABLE incidents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity ENUM('low','medium','high','crit') DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  reported_date DATE NULL,
  closed_date DATE NULL,
  owner VARCHAR(255) DEFAULT NULL,
  root_cause TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Risks
CREATE TABLE risks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  risk_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  likelihood ENUM('low','medium','high') DEFAULT 'medium',
  impact ENUM('low','medium','high') DEFAULT 'medium',
  score INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'open',
  mitigation TEXT,
  owner VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Compliance items
CREATE TABLE compliance_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  framework VARCHAR(100) NOT NULL,
  requirement_id VARCHAR(100) NOT NULL,
  requirement TEXT,
  status VARCHAR(50) DEFAULT 'non_compliant',
  evidence TEXT,
  owner VARCHAR(255) DEFAULT NULL,
  due_date DATE NULL,
  completed_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
