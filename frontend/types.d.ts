declare global {
    // Form
    type Form = {
        slug: string
        title: string
        description: string | null
        anonymous_submissions: boolean
        limit: number | null
        waitlist: boolean
        multiple_submissions: boolean
        published_at: string
        expires_at: string
    }

    type GetFormProps = Form & {
        id: string
        created_at: string
        updated_at: string
    }

    type GetFormsProps = {
        data: GetFormProps[]
        total: number
    }

    type Template = Form & {
        source_form_id?: string | null
    }

    type GetTemplateProps = Template & {
        id: string
        created_at: string
        updated_at: string
        creator_name?: string
        creator_email?: string
        fields?: {
            id: string
            field_type: string
            title: string
            description: string | null
            required: boolean
            options: string[] | null
            validation: Record<string, any> | null
            field_order: number
        }[]
    }

    type GetTemplatesProps = {
        data: GetTemplateProps[]
        total: number
    }

    type PostTemplateProps = Template

    type PutTemplateProps = Template

    type PostFormProps = Form

    type PutFormProps = Form

    type GetPublicFormProps = Form & {
        id: string
        creator_email: string
        creator_name: string
        registered_count: string
        user_has_submitted?: boolean
        fields: {
            id: string
            field_type: string
            title: string
            description: string | null
            required: boolean
            options: string[] | null
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            validation: Record<string, any> | null
            field_order: number
        }[]
    }

    // Fields
    type FieldProps = {
        form_id: string
        field_type: string
        title: string
        description: string | null
        required: boolean
        options: string[] | null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validation: Record<string, any> | null
        field_order: number
    }

    type GetFieldProps = FieldProps & {
        id: string
        created_at: string
    }

    type GetFieldsProps = GetFieldProps[]

    type PatchFieldsProps = {
        operation: 'create' | 'update' | 'delete'
        id?: string
        data: FieldProps
    }[]

    type TemplateFieldProps = Omit<FieldProps, 'form_id'> & {
        template_id: string
    }

    type PatchTemplateFieldsProps = {
        operation: 'create' | 'update' | 'delete'
        id?: string
        data: TemplateFieldProps
    }[]

    // Permissions
    type PermissionProps = {
        group: string | null
        user_email: string | null
    }

    type GetPermissionProps = PermissionProps & {
        id: string
        form_id: string
        granted_by_email: string
        created_at: string
        updated_at: string
    }

    type GetPermissionsProps = {
        data: GetPermissionProps[]
        total: number
    }

    type PostPermissionProps = PermissionProps

    type GetTemplatePermissionProps = PermissionProps & {
        id: string
        template_id: string
        granted_by_email: string
        created_at: string
        updated_at: string
    }

    type GetTemplatePermissionsProps = {
        data: GetTemplatePermissionProps[]
        total: number
    }

    // Submissions
    type SubmissionProps = {
        field_id?: string | null
        value?: string | null
    }

    type Submission = {
        id: string
        form_id: string
        form_title: string
        user_email: string | null
        user_name: string | null
        status: string
        submitted_at: string
        data: SubmissionProps[]
        scanned_at?: string | null
        already_scanned?: boolean
    }

    type GetSubmissionsProps = {
        data: {
            id: string
            user_email: string | null
            user_name: string | null
            status: string
            scanned_at: string | null
            expires_at: string
            submitted_at: string
            answers?: { field_id: string; value: string }[]
        }[]
        total: number
        fields?: GetFieldsProps
    }

    type PostSubmissionProps = {
        fields: { field_id: string; value: string }[]
    }
}

export { }
