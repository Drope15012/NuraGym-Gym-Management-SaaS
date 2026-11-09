CREATE TABLE IF NOT EXISTS gyms (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL DEFAULT 'Main branch',
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
  state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
  postal_code VARCHAR(30),
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  logo_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'trial',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  gym_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY users_gym_email_unique (gym_id, email),
  CONSTRAINT users_gym_fk FOREIGN KEY (gym_id) REFERENCES gyms(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  gym_id VARCHAR(36) NOT NULL UNIQUE,
  plan_name VARCHAR(100) NOT NULL DEFAULT 'Trial',
  status VARCHAR(30) NOT NULL DEFAULT 'trial',
  trial_ends_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subscriptions_gym_fk FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memberships (
  id VARCHAR(36) PRIMARY KEY,
  gym_id VARCHAR(36) NOT NULL,
  member_id VARCHAR(36) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT memberships_gym_fk FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT memberships_member_fk FOREIGN KEY (member_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  gym_id VARCHAR(36) NOT NULL,
  member_id VARCHAR(36) NOT NULL,
  membership_id VARCHAR(36),
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'paid',
  reference VARCHAR(255),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payments_gym_fk FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT payments_member_fk FOREIGN KEY (member_id) REFERENCES users(id),
  CONSTRAINT payments_membership_fk FOREIGN KEY (membership_id) REFERENCES memberships(id)
);

CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(36) PRIMARY KEY,
  gym_id VARCHAR(36) NOT NULL,
  trainer_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  starts_at DATETIME NOT NULL,
  duration_minutes INT NOT NULL,
  capacity INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  CONSTRAINT classes_gym_fk FOREIGN KEY (gym_id) REFERENCES gyms(id),
  CONSTRAINT classes_trainer_fk FOREIGN KEY (trainer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS class_attendees (
  class_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (class_id, user_id),
  CONSTRAINT attendees_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT attendees_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(36) PRIMARY KEY,
  gym_id VARCHAR(36) NOT NULL,
  member_id VARCHAR(36) NOT NULL,
  checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checkin_date DATE NOT NULL,
  CONSTRAINT attendance_gym_fk FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
  CONSTRAINT attendance_member_fk FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY attendance_member_day_unique (gym_id, member_id, checkin_date)
);

CREATE INDEX users_gym_idx ON users(gym_id);
CREATE INDEX memberships_gym_idx ON memberships(gym_id);
CREATE INDEX payments_gym_idx ON payments(gym_id);
CREATE INDEX classes_gym_idx ON classes(gym_id);
CREATE INDEX attendance_gym_date_idx ON attendance(gym_id, checkin_date);

CREATE TABLE IF NOT EXISTS gym_applications (
  application_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  gym_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX gym_applications_status_idx (status),
  INDEX gym_applications_applied_at_idx (applied_at)
);
