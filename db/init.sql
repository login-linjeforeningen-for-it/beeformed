-- Enums
CREATE TYPE submission_status AS ENUM ('registered', 'waitlisted', 'cancelled', 'rejected');
CREATE TYPE field_type_enum AS ENUM ('text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date', 'time', 'datetime');

-- Users 
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forms
CREATE TABLE forms (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    anonymous_submissions BOOLEAN DEFAULT FALSE,
    "limit" INTEGER,
    waitlist BOOLEAN DEFAULT FALSE,
    multiple_submissions BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form fields
CREATE TABLE form_fields (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    field_type field_type_enum NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    required BOOLEAN DEFAULT FALSE,
    options TEXT[],
    validation JSONB,
    field_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form submissions
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    status submission_status DEFAULT 'registered',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scanned_at TIMESTAMP
);

-- Submission data
CREATE TABLE submission_data (
    id SERIAL PRIMARY KEY,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES form_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form permissions
CREATE TABLE form_permissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    "group" TEXT,
    granted_by TEXT REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, user_id, "group")
);

-- Indexes for performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX idx_submissions_form_id ON submissions(form_id);
CREATE INDEX idx_submission_data_submission_id ON submission_data(submission_id);
CREATE INDEX idx_form_permissions_form_id ON form_permissions(form_id);
CREATE INDEX idx_form_permissions_user_id ON form_permissions(user_id);