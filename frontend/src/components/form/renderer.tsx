'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, toast, Input, Textarea, Select, Radio, Checkbox, Switch } from 'uibee/components'
import { postSubmission } from '@utils/api/client'

interface FormField {
    id: string
    field_type: string
    title: string
    description: string | null
    required: boolean
    options: string[] | null
    validation: Record<string, unknown> | null
    field_order: number
}

interface FormData {
    id: string
    title: string
    description: string | null
    creator_name: string
    creator_email: string
    fields: FormField[]
    limit: number | null
    waitlist: boolean
    multiple_submissions: boolean
    registered_count: string
    user_has_submitted?: boolean
}



export default function FormRenderer({ form, submission }: { form: FormData; submission?: Submission }) {
    const [loading, setLoading] = useState(false)
    const registeredCount = parseInt(form.registered_count || '0')
    const isFull = form.limit !== null && registeredCount >= form.limit
    const isWaitlist = isFull && form.waitlist
    const blockMultiple = !form.multiple_submissions && form.user_has_submitted
    const canSubmit = (!isFull || form.waitlist) && !blockMultiple
    const showFields = ( !isFull || form.waitlist ) && ( !blockMultiple || submission )
    const router = useRouter()

    function hasRequiredValue(field: FormField, rawValue: string | undefined): boolean {
        if (!field.required) return true

        const value = (rawValue ?? '').trim()

        if (field.field_type === 'checkbox' && (!Array.isArray(field.options) || field.options.length === 0)) {
            return value.toLowerCase() === 'true'
        }

        return value.length > 0
    }

    function validateRequiredFields(): string[] {
        const missing: string[] = []

        for (const field of form.fields) {
            if (!field.required) continue
            if (!hasRequiredValue(field, formData[field.id])) {
                missing.push(field.title)
            }
        }

        return missing
    }

    const [formData, setFormData] = useState<Record<string, string>>(() => {
        if (submission) {
            const data: Record<string, string> = {}
            submission.data.forEach((field, i) => {
                if (field.field_id === null || field.field_id === undefined) {
                    console.warn('Skipped submission field without field_id', { field, index: i })
                    return
                }
                data[field.field_id.toString()] = field.value ?? ''
            })
            return data
        }
        return {}
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (submission) return

        const missingRequired = validateRequiredFields()
        if (missingRequired.length > 0) {
            toast.error(`Please fill required fields: ${missingRequired.join(', ')}`)
            return
        }

        setLoading(true)

        try {
            const fields = form.fields.map(field => ({
                field_id: field.id,
                value: formData[field.id] || ''
            }))

            const result = await postSubmission(form.id, { fields }) as { id: string }

            toast.success('Form submitted successfully!')
            setFormData({})
            router.push(`/submissions/${result.id}`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred while submitting the form')
        } finally {
            setLoading(false)
        }
    }

    function renderField(field: FormField) {
        const value = formData[field.id] || ''
        const setValue = (newValue: string | number) => {
            if (submission || blockMultiple) return
            setFormData(prev => ({ ...prev, [field.id]: String(newValue) }))
        }

        const disabled = !!submission || blockMultiple

        switch (field.field_type) {
            case 'text':
                return (
                    <Input
                        name={field.id}
                        textSize='md'
                        type='text'
                        label={field.title}
                        description={field.description || undefined}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required={field.required}
                        disabled={disabled}
                    />
                )
            case 'textarea':
                return (
                    <Textarea
                        name={field.id}
                        textSize='md'
                        label={field.title}
                        description={field.description || undefined}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required={field.required}
                        rows={4}
                        disabled={disabled}
                    />
                )
            case 'number':
                return (
                    <Input
                        name={field.id}
                        textSize='md'
                        type='number'
                        label={field.title}
                        description={field.description || undefined}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required={field.required}
                        disabled={disabled}
                    />
                )
            case 'select': {
                const choices = Array.isArray(field.options) ? field.options : []
                const selectOptions = choices.map((choice: string) => ({
                    value: choice,
                    label: choice
                }))
                return (
                    <Select
                        name={field.id}
                        textSize='md'
                        label={field.title}
                        description={field.description || undefined}
                        value={value}
                        onChange={(value) => {
                            if (value !== null) setValue(value)
                        }}
                        options={selectOptions}
                        required={field.required}
                        searchable={choices.length > 5}
                        disabled={disabled}
                    />
                )
            }
            case 'radio': {
                const radioOptions = Array.isArray(field.options) ? field.options : []
                return (
                    <Radio
                        name={field.id}
                        textSize='md'
                        label={field.title}
                        description={field.description || undefined}
                        value={value}
                        options={radioOptions.map(option => ({ value: option, label: option }))}
                        onChange={(value) => setValue(value)}
                        required={field.required}
                        disabled={disabled}
                    />
                )
            }
            case 'checkbox': {
                if (field.options && Array.isArray(field.options)) {
                    const checkboxOptions = field.options
                    const selectedValues = value ? value.split(',') : []
                    return (
                        <Checkbox
                            name={field.id}
                            textSize='md'
                            type='checkbox'
                            label={field.title}
                            description={field.description || undefined}
                            options={checkboxOptions.map(option => ({ value: option, label: option }))}
                            value={selectedValues}
                            onChange={(newValues) => {
                                setValue(newValues.join(','))
                            }}
                            required={field.required}
                            disabled={disabled}
                        />
                    )
                } else {
                    return (
                        <Switch
                            name={field.id}
                            textSize='md'
                            label={field.title}
                            description={field.description || undefined}
                            checked={value === 'true'}
                            onChange={(checked) => setValue(checked ? 'true' : 'false')}
                            disabled={disabled}
                        />
                    )
                }
            }
            case 'date': {
                return (
                    <Input
                        name={field.id}
                        textSize='md'
                        type='date'
                        label={field.title}
                        description={field.description || undefined}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required={field.required}
                        disabled={disabled}
                    />
                )
            }
            case 'time': {
                return (
                    <Input
                        name={field.id}
                        textSize='md'
                        type='time'
                        label={field.title}
                        description={field.description || undefined}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required={field.required}
                        disabled={disabled}
                    />
                )
            }
            case 'datetime': {
                return (
                    <Input
                        name={field.id}
                        textSize='md'
                        type='datetime-local'
                        label={field.title}
                        description={field.description || undefined}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required={field.required}
                        disabled={disabled}
                    />
                )
            }
            default: {
                return (
                    <Input
                        name={field.id}
                        textSize='md'
                        type='text'
                        label={field.title}
                        description={field.description || undefined}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required={field.required}
                        disabled={disabled}
                    />
                )
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className='space-y-6 h-full'>
            {!submission && blockMultiple && (
                <Alert variant='warning'>
                    <p>
                        You have already submitted this form. Multiple submissions are not allowed.
                    </p>
                </Alert>
            )}

            {!submission && !blockMultiple && isFull && !form.waitlist && (
                <Alert variant='warning'>
                    <p>
                        This form is currently full.
                    </p>
                </Alert>
            )}

            {!submission && !blockMultiple && isWaitlist && (
                <Alert variant='info'>
                    <p>
                        This form is full. Submitting now will place you on the waitlist.
                    </p>
                </Alert>
            )}

            {showFields && form.fields
                .sort((a, b) => a.field_order - b.field_order)
                .map(field => (
                    <div key={field.id} className='max-w-2xl'>
                        {renderField(field)}
                    </div>
                ))
            }

            {!submission && canSubmit && (
                <div className='max-w-2xl'>
                    <button
                        type='submit'
                        disabled={loading}
                        className='w-full px-4 py-3 bg-login text-login-900 rounded-md
                            hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-colors focus:outline-none focus:ring-2 focus:ring-login
                            focus:ring-offset-2 focus:ring-offset-login-700 font-medium cursor-pointer'
                    >
                        {loading ? 'Submitting...' : (isWaitlist ? 'Join Waitlist' : 'Submit Form')}
                    </button>
                </div>
            )}
        </form>
    )
}
