export { }

declare global {
    // Routes
    export type ListQuerystring = {
        search?: string
        limit?: string
        offset?: string
        order_by?: string
        sort?: string
    }

    export type IdParams = {
        id: string
    }

    export type OptionalIdParams = {
        id?: string
    }

    export type FormIdAndIdParams = {
        formId: string
        id: string
    }

    export type TemplateIdAndIdParams = {
        templateId: string
        id: string
    }

    export type SourceFormParams = {
        id?: string
        sourceFormId?: string
    }

    export type SourceTemplateParams = {
        id?: string
        sourceTemplateId?: string
    }

    export type FormAndPermissionParams = {
        id: string
    }

    export type TemplateAndPermissionParams = {
        id: string
    }

    export type SubmissionsByFormQuerystring = ListQuerystring & {
        include_answers?: string
    }

    export type SubmissionByIdQuerystring = {
        formId?: string
    }

    export type ScanSubmissionBody = {
        form_id?: string
    }

    export type SubmissionFieldInput = {
        field_id: string
        value: unknown
    }

    export type CreateSubmissionBody = {
        fields: SubmissionFieldInput[]
    }

    export type PermissionGrantBody = {
        user_email?: string | null
        group?: string | null
    }

    export type CreateOrUpdateFormBody = {
        slug: string
        title: string
        description?: string | null
        anonymous_submissions?: boolean
        limit?: number | null
        waitlist?: boolean
        multiple_submissions?: boolean
        published_at: string
        expires_at: string
    }

    export type CreateTemplateBody = {
        source_form_id?: string | null
        slug: string
        title: string
        description?: string | null
        anonymous_submissions?: boolean
        limit?: number | null
        waitlist?: boolean
        multiple_submissions?: boolean
        published_at: string
        expires_at: string
    }

    export type UpdateTemplateBody = {
        slug: string
        title: string
        description?: string | null
        anonymous_submissions?: boolean
        limit?: number | null
        waitlist?: boolean
        multiple_submissions?: boolean
        published_at: string
        expires_at: string
    }

    export type BulkFormFieldOperation = {
        operation: 'create' | 'update' | 'delete'
        id?: string
        data?: Partial<{
            form_id: string
            field_type: string
            title: string
            description?: string
            required: boolean
            options?: string[]
            validation?: unknown
            field_order: number
        }>
    }

    export type BulkTemplateFieldOperation = {
        operation: 'create' | 'update' | 'delete'
        id?: string
        data?: Partial<{
            template_id: string
            field_type: string
            title: string
            description?: string
            required: boolean
            options?: string[]
            validation?: unknown
            field_order: number
        }>
    }

    type SQLParamType = string | number | boolean | null | Date | string[]

    interface User {
        user_id: string
        email: string
        name?: string
        created_at: Date
        last_active_at: Date
        inactivity_warning_sent_at: Date | null
    }

    interface Form {
        id: string
        user_id: string
        slug: string
        title: string
        description?: string
        anonymous_submissions: boolean
        limit?: number
        waitlist: boolean
        published_at: Date
        expires_at: Date
        created_at: Date
        updated_at: Date
        form_deletion_warning_sent_at?: Date | null
    }

    interface FormField {
        id: string
        form_id: string
        field_type: string
        title: string
        description?: string
        required: boolean
        options?: string[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validation?: any
        field_order: number
        created_at: Date
    }

    interface FormPermission {
        id: string
        form_id: string
        user_id: string
        group?: string
        granted_by: string
        created_at: Date
        updated_at: Date
    }

    interface Submission {
        id: string
        form_id: string
        user_id?: string
        submitted_at: Date
        data?: { field_id: string | null; value: string | null }[]
    }

    type EmailTemplate = {
        subject: string
        html: string
        text: string
        attachments?: Array<{
            filename: string
            content: Buffer
            contentType: string
        }>
    }

    type EmailContent = {
        title: string
        status: 'registered' | 'waitlisted' | 'rejected' | 'cancelled' | 'bumped'
        ownerEmail: string
        actionUrl?: string
        actionText?: string
        submissionId: string
    }

    type AccountDeletionWarningEmailContent = {
        name?: string | null
        warningDays: number
        actionUrl: string
    }

    type FormDeletionWarningEmailContent = {
        name?: string | null
        formTitle: string
        warningDays: number
        actionUrl: string
    }

}
