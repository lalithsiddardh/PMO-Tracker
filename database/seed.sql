USE fluentgrid_pmo;

-- Seed users (passwords are BCrypt hashes of "demo1234")
INSERT INTO users (email, password_hash, name, role, status, created_at, updated_at) VALUES
('superadmin@fluentgrid.com', '$2b$10$6d.nwOTFxVbmH7WlBN9Uruaj5PS1hlx8UAHMZFt33UKsivT0uO10W', 'Super Admin', 'SUPER_ADMIN', 'ACTIVE', NOW(), NOW()),
('admin@fluentgrid.com', '$2b$10$6d.nwOTFxVbmH7WlBN9Uruaj5PS1hlx8UAHMZFt33UKsivT0uO10W', 'Admin User', 'ADMIN', 'ACTIVE', NOW(), NOW()),
('harsha@fluentgrid.com', '$2b$10$6d.nwOTFxVbmH7WlBN9Uruaj5PS1hlx8UAHMZFt33UKsivT0uO10W', 'Harsha V.', 'PM', 'ACTIVE', NOW(), NOW()),
('aditya@fluentgrid.com', '$2b$10$6d.nwOTFxVbmH7WlBN9Uruaj5PS1hlx8UAHMZFt33UKsivT0uO10W', 'Aditya Vijay', 'PM', 'ACTIVE', NOW(), NOW()),
('murali@fluentgrid.com', '$2b$10$6d.nwOTFxVbmH7WlBN9Uruaj5PS1hlx8UAHMZFt33UKsivT0uO10W', 'Murali Baggam', 'PM', 'ACTIVE', NOW(), NOW());

-- Seed 37 projects
INSERT INTO projects (name, bu, type, infra_managed_by, spoc, progress, status, start_date, end_date, team_size, budget, created_by, created_at, updated_at) VALUES
('KESB-CRM', 'CIS', 'Implementation', 'Fluentgrid', 'Murali Baggam', 85, 'ontrack', '2023-01-01', '2024-06-30', 8, 120, 2, NOW(), NOW()),
('Bihar-RMS', 'CIS', 'Implementation', 'Fluentgrid', 'Srinivasa Rao P', 72, 'atrisk', '2023-03-01', '2024-09-30', 6, 95, 2, NOW(), NOW()),
('APEPDCL-URMS', 'CIS', 'Implementation', 'Fluentgrid', 'Murali Baggam', 91, 'ontrack', '2022-06-01', '2024-03-31', 10, 150, 2, NOW(), NOW()),
('APCPDCL-URMS', 'CIS', 'Implementation', 'Fluentgrid', 'Srinivasa Rao P', 68, 'delayed', '2022-08-01', '2024-12-31', 9, 140, 2, NOW(), NOW()),
('EUCL-AMS', 'CIS', 'Maintenance', 'Client', 'Hemanth M', 78, 'ontrack', '2023-06-01', '2025-05-31', 4, 55, 2, NOW(), NOW()),
('DABS-AMS', 'CIS', 'Maintenance', 'Client', 'Hemanth M', 82, 'ontrack', '2023-04-01', '2025-03-31', 3, 45, 2, NOW(), NOW()),
('OSHEE-AMS', 'CIS', 'Maintenance', 'Client', 'Hemanth M', 75, 'ontrack', '2023-07-01', '2025-06-30', 3, 40, 2, NOW(), NOW()),
('JBVNL-AMS', 'CIS', 'Maintenance', 'Client', 'Hemanth M', 80, 'ontrack', '2023-05-01', '2025-04-30', 3, 42, 2, NOW(), NOW()),
('TP Odisha-AMS', 'CIS', 'Maintenance', 'Client', 'Amarnath S / Nanaji', 70, 'atrisk', '2023-02-01', '2025-01-31', 5, 60, 2, NOW(), NOW()),
('APDCL HES', 'AMI', 'Implementation', 'Fluentgrid', 'Rakesh Chakladar', 55, 'atrisk', '2023-09-01', '2025-08-31', 12, 200, 2, NOW(), NOW()),
('PSPCL', 'AMI', 'Maintenance', 'Client', 'Sandeep Sharma', 88, 'ontrack', '2022-11-01', '2024-10-31', 5, 70, 2, NOW(), NOW()),
('Nuri-Ethiopia', 'AMI', 'Maintenance', 'Client', 'Srinivas M', 6, 'pending', '2024-01-01', '2025-12-31', 2, 25, 2, NOW(), NOW()),
('NCC-NBPDCL', 'AMI', 'Implementation', 'Fluentgrid', 'Mohan Vamsi U', 45, 'delayed', '2023-10-01', '2025-09-30', 7, 110, 2, NOW(), NOW()),
('Torrent HES', 'AMI', 'Implementation', 'Fluentgrid', 'Satyanarayana S / Chander Mohan', 62, 'ontrack', '2023-05-01', '2025-04-30', 9, 160, 2, NOW(), NOW()),
('Allied-MES', 'AMI', 'Implementation', 'Fluentgrid', 'Mohan Vamsi U', 38, 'delayed', '2023-11-01', '2025-10-31', 5, 80, 2, NOW(), NOW()),
('IntelliSmart-APDCL-Assam', 'AMI', 'Maintenance', 'Client', 'Satyanarayana S', 74, 'ontrack', '2023-08-01', '2025-07-31', 4, 50, 2, NOW(), NOW()),
('SBPDCL', 'AMI', 'Maintenance', 'Client', 'Aditya Vijay', 38, 'onhold', '2023-01-01', '2026-12-31', 6, 90, 2, NOW(), NOW()),
('BEST MDMS', 'AMI', 'Maintenance', 'Client', 'Sangram B / Radha Krishna R', 80, 'ontrack', '2023-03-01', '2025-02-28', 4, 48, 2, NOW(), NOW()),
('AEML-HES', 'AMI', 'Maintenance', 'Client', 'Srinivas Munagada', 76, 'ontrack', '2023-06-01', '2025-05-31', 3, 44, 2, NOW(), NOW()),
('Adani-BEST HES', 'AMI', 'Maintenance', 'Client', 'Ritesh Kumar / Radha Krishna R', 72, 'ontrack', '2023-04-01', '2025-03-31', 4, 52, 2, NOW(), NOW()),
('TPCODL', 'AMI', 'Maintenance', 'Client', 'Krishna Chand K / Srinivas M', 78, 'ontrack', '2023-02-01', '2025-01-31', 5, 58, 2, NOW(), NOW()),
('TPSODL', 'AMI', 'Maintenance', 'Client', 'Krishna Chand K / Srinivas M', 74, 'ontrack', '2023-05-01', '2025-04-30', 4, 50, 2, NOW(), NOW()),
('Nuri-PNG', 'AMI', 'Implementation', 'Fluentgrid', 'Aditya Vijay', 35, 'atrisk', '2024-02-01', '2025-11-30', 6, 100, 2, NOW(), NOW()),
('VSD-TNB', 'AMI', 'Implementation', 'Fluentgrid', 'Ketan Goswami', 50, 'ontrack', '2023-12-01', '2025-11-30', 8, 130, 2, NOW(), NOW()),
('TPDDL', 'AMI', 'Maintenance', 'Client', 'Subrat Kumar Tiwari / Aditya Vijay', 76, 'ontrack', '2023-07-01', '2025-06-30', 5, 62, 2, NOW(), NOW()),
('TPM-HES', 'AMI', 'Maintenance', 'Client', 'Sangram B / Aniket Sangar', 82, 'ontrack', '2023-09-01', '2025-08-31', 3, 40, 2, NOW(), NOW()),
('TPM-MDMS', 'AMI', 'Maintenance', 'Client', 'Sangram B / Aniket Sangar', 78, 'ontrack', '2023-10-01', '2025-09-30', 3, 38, 2, NOW(), NOW()),
('APRAAVA-PED-AMI', 'AMI', 'Implementation', 'Fluentgrid', 'Radha Krishna R', 42, 'atrisk', '2024-01-01', '2025-12-31', 7, 115, 2, NOW(), NOW()),
('Adnoc', 'AMI', 'Implementation', 'Fluentgrid', 'Ketan Goswami', 28, 'delayed', '2024-03-01', '2026-02-28', 10, 180, 2, NOW(), NOW()),
('KESCo-HES', 'AMI', 'Maintenance', 'Client', 'Srinivas M / Mohd Adil', 70, 'ontrack', '2023-11-01', '2025-10-31', 3, 42, 2, NOW(), NOW()),
('NDMC', 'AMI', 'Maintenance', 'Client', 'Srinivas M / Subrat', 74, 'ontrack', '2023-08-01', '2025-07-31', 3, 40, 2, NOW(), NOW()),
('BOSCH-HES', 'AMI', 'Maintenance', 'Client', 'Srinivas M / Manohar Lal', 72, 'ontrack', '2023-12-01', '2025-11-30', 3, 38, 2, NOW(), NOW()),
('PSPCL Allied', 'AMI', 'Maintenance', 'Client', 'Sandeep Sharma / Srinivas Munagada', 76, 'ontrack', '2023-06-01', '2025-05-31', 4, 48, 2, NOW(), NOW()),
('BenSCL-AMS', 'ACT', 'Maintenance', 'Client', 'Krishna PVG', 80, 'ontrack', '2023-04-01', '2025-03-31', 3, 35, 2, NOW(), NOW()),
('LSCL-AMS', 'ACT', 'Maintenance', 'Client', 'Abhishek Kumar Mishra', 78, 'ontrack', '2023-05-01', '2025-04-30', 3, 32, 2, NOW(), NOW()),
('NTPC-AMS', 'ACT', 'Maintenance', 'Client', 'Sridhar B', 82, 'ontrack', '2023-03-01', '2025-02-28', 4, 38, 2, NOW(), NOW()),
('Kamrajar Port-ICCC', 'ACT', 'Maintenance', 'Client', 'Robert K', 74, 'ontrack', '2023-09-01', '2025-08-31', 5, 45, 2, NOW(), NOW());

-- Project assignments (Admin -> PM)
INSERT INTO project_assignments (project_id, pm_id, assigned_by, created_at)
SELECT p.id, u.id, 2, NOW() FROM projects p, users u WHERE u.email = 'harsha@fluentgrid.com' AND p.bu = 'CIS';

INSERT INTO project_assignments (project_id, pm_id, assigned_by, created_at)
SELECT p.id, u.id, 2, NOW() FROM projects p, users u WHERE u.email = 'aditya@fluentgrid.com' AND p.name IN ('SBPDCL','Nuri-PNG','Nuri-Ethiopia');

INSERT INTO project_assignments (project_id, pm_id, assigned_by, created_at)
SELECT p.id, u.id, 2, NOW() FROM projects p, users u WHERE u.email = 'murali@fluentgrid.com' AND p.name IN ('KESB-CRM','APEPDCL-URMS');

-- Seed sample deliverables
INSERT INTO deliverables (project_id, name, category, frequency, exec_type, last_date, next_date, reminder_days, owner, scope, remarks, status, created_by, created_at, updated_at)
SELECT p.id, 'External VAPT (CERT-In empaneled)', 'external_vapt', 'annual', 'thirdparty', '2025-08-12', DATE_ADD(CURDATE(), INTERVAL -10 DAY), 60, 'Harsha V.', 'All internet-facing web apps', 'Remediation closed', 'overdue', 2, NOW(), NOW()
FROM projects p WHERE p.name = 'SBPDCL';

INSERT INTO deliverables (project_id, name, category, frequency, exec_type, last_date, next_date, reminder_days, owner, scope, remarks, status, created_by, created_at, updated_at)
SELECT p.id, 'Internal VAPT (Client quarterly)', 'internal_vapt', 'quarterly', 'internal', '2026-03-15', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 30, 'Harsha V.', 'Internal network scan', 'N/A', 'due_soon', 2, NOW(), NOW()
FROM projects p WHERE p.name = 'SBPDCL';

INSERT INTO deliverables (project_id, name, category, frequency, exec_type, last_date, next_date, reminder_days, owner, scope, remarks, status, created_by, created_at, updated_at)
SELECT p.id, 'Patch Management', 'patch_mgmt', 'monthly', 'internal', '2026-05-01', DATE_ADD(CURDATE(), INTERVAL 90 DAY), 20, 'IT Ops', 'Server patching', 'Automated', 'valid', 2, NOW(), NOW()
FROM projects p WHERE p.name = 'SBPDCL';
