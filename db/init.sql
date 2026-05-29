-- Enums
CREATE TYPE submission_status AS ENUM ('registered', 'waitlisted', 'cancelled', 'rejected');
CREATE TYPE field_type_enum AS ENUM ('text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date', 'time', 'datetime');

-- Users
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    inactivity_warning_sent_at TIMESTAMP
);

-- Forms
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9\-_]+$'),
    title VARCHAR(255) NOT NULL CHECK (char_length(title) > 0),
    description VARCHAR(5000),
    anonymous_submissions BOOLEAN DEFAULT FALSE,
    "limit" INTEGER CHECK ("limit" IS NULL OR "limit" > 0),
    waitlist BOOLEAN DEFAULT FALSE,
    multiple_submissions BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    form_deletion_warning_sent_at TIMESTAMP,
    CHECK (published_at < expires_at)
);

-- Form fields
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    field_type field_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL CHECK (char_length(title) > 0),
    description VARCHAR(2000),
    required BOOLEAN DEFAULT FALSE,
    options TEXT[],
    field_order INTEGER NOT NULL CHECK (field_order >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Form submissions
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    status submission_status DEFAULT 'registered',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scanned_at TIMESTAMP
);

-- Submission data
CREATE TABLE submission_data (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form permissions
CREATE TABLE form_permissions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    "group" TEXT,
    granted_by TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE NULLS NOT DISTINCT (form_id, user_id, "group"),
    CHECK (num_nonnulls(user_id, "group") = 1)
);

-- Form templates
CREATE TABLE form_templates (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    source_form_id UUID REFERENCES forms(id) ON DELETE SET NULL,
    slug VARCHAR(100) UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9\-_]+$'),
    title VARCHAR(255) NOT NULL CHECK (char_length(title) > 0),
    description VARCHAR(5000),
    anonymous_submissions BOOLEAN DEFAULT FALSE,
    "limit" INTEGER CHECK ("limit" IS NULL OR "limit" > 0),
    waitlist BOOLEAN DEFAULT FALSE,
    multiple_submissions BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template fields
CREATE TABLE template_fields (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    field_type field_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL CHECK (char_length(title) > 0),
    description VARCHAR(2000),
    required BOOLEAN DEFAULT FALSE,
    options TEXT[],
    field_order INTEGER NOT NULL CHECK (field_order >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template permissions
CREATE TABLE template_permissions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    "group" TEXT,
    granted_by TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE NULLS NOT DISTINCT (template_id, user_id, "group"),
    CHECK (num_nonnulls(user_id, "group") = 1)
);

-- Email queue
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    "to" TEXT NOT NULL,
    email_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0),
    last_attempted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_forms_form_deletion_warning_sent_at ON forms(form_deletion_warning_sent_at);
CREATE INDEX idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX idx_form_fields_form_id_active ON form_fields(form_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_submissions_form_id ON submissions(form_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submission_data_submission_id ON submission_data(submission_id);
CREATE INDEX idx_submission_data_field_id ON submission_data(field_id);
CREATE INDEX idx_form_permissions_form_id ON form_permissions(form_id);
CREATE INDEX idx_form_permissions_user_id ON form_permissions(user_id);
CREATE INDEX idx_users_last_active_at ON users(last_active_at);
CREATE INDEX idx_users_inactivity_warning_sent_at ON users(inactivity_warning_sent_at);
CREATE INDEX idx_form_templates_user_id ON form_templates(user_id);
CREATE INDEX idx_form_templates_source_form_id ON form_templates(source_form_id);
CREATE INDEX idx_template_fields_template_id ON template_fields(template_id);
CREATE INDEX idx_template_permissions_template_id ON template_permissions(template_id);
CREATE INDEX idx_template_permissions_user_id ON template_permissions(user_id);
CREATE INDEX idx_submissions_form_id_status ON submissions(form_id, status);
CREATE INDEX idx_email_queue_retry ON email_queue(retry_count, last_attempted_at);
