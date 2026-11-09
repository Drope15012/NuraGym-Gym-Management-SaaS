CREATE INDEX idx_users_gym_role ON users (gym_id, role);
CREATE INDEX idx_memberships_gym_status ON memberships (gym_id, status);
CREATE INDEX idx_payments_gym_status ON payments (gym_id, status);
CREATE INDEX idx_classes_gym_starts_at ON classes (gym_id, starts_at);
