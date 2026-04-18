'use client'

import { useState, useRef } from 'react'
import { Textarea, toast } from 'uibee/components'
import { patchFields } from '@utils/api/client'
import { Input, Switch, Select } from 'uibee/components'
import { GripVertical, X, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EditFieldsPage({ fields, formId }: { fields: GetFieldsProps; formId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fieldsData, setFieldsData] = useState(fields)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const lastReorderRef = useRef<number | null>(null)

    const fieldTypeOptions = [
        { value: 'text', label: 'Text' },
        { value: 'textarea', label: 'Textarea' },
        { value: 'number', label: 'Number' },
        { value: 'select', label: 'Select' },
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'radio', label: 'Radio' },
        { value: 'date', label: 'Date' },
        { value: 'time', label: 'Time' },
        { value: 'datetime', label: 'DateTime' }
    ]

    function handleDragStart(index: number) {
        setDraggedIndex(index)
        lastReorderRef.current = null
    }

    function handleDragOver(e: React.DragEvent, targetIndex: number) {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === targetIndex || lastReorderRef.current === targetIndex) return

        lastReorderRef.current = targetIndex
        const newFields = [...fieldsData]
        const [draggedField] = newFields.splice(draggedIndex, 1)
        newFields.splice(targetIndex, 0, draggedField)

        newFields.forEach((field, i) => {
            field.field_order = i + 1
        })

        setFieldsData(newFields)
        setDraggedIndex(targetIndex)
    }

    function handleDrop() {
        setDraggedIndex(null)
        lastReorderRef.current = null
    }

    function handleAddField() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newField: any = {
            id: null,
            title: '',
            description: '',
            field_type: 'text',
            required: false,
            options: null,
            validation: null,
            field_order: fieldsData.length + 1,
            operation: 'create'
        }
        setFieldsData(prev => [...prev, newField])
    }

    function handleAddFieldAt(position: number) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newField: any = {
            id: null,
            title: '',
            description: '',
            field_type: 'text',
            required: false,
            options: null,
            validation: null,
            field_order: position + 1,
            operation: 'create'
        }
        setFieldsData(prev => {
            const newFields = [...prev]
            newFields.splice(position, 0, newField)
            newFields.forEach((field, i) => {
                field.field_order = i + 1
            })
            return newFields
        })
    }

    function handleRemove(index: number) {
        setFieldsData(prev => prev.map((f, i) => i === index ? { ...f, deleted: true } : f))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const operations: PatchFieldsProps = []

            for (const field of fieldsData as (GetFieldProps & {
                id?: string | null
                operation?: 'create' | 'update'
                deleted?: boolean
            })[]) {
                const fieldId = field.id ? String(field.id) : undefined

                if (field.deleted) {
                    if (fieldId) {
                        operations.push({
                            operation: 'delete',
                            id: fieldId,
                            data: {} as FieldProps
                        })
                    }
                    continue
                }

                const data: FieldProps = {
                    form_id: formId,
                    field_type: field.field_type,
                    title: field.title,
                    description: field.description,
                    required: field.required,
                    options: Array.isArray(field.options) ? field.options : null,
                    validation: field.validation,
                    field_order: field.field_order
                }

                if (fieldId && field.operation !== 'create') {
                    operations.push({
                        operation: 'update',
                        id: fieldId,
                        data
                    })
                } else {
                    operations.push({
                        operation: 'create',
                        data
                    })
                }
            }

            await patchFields(formId, operations)
            toast.success('Fields updated successfully!')
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                    e.preventDefault()
                }
            }}
            className='w-full'
        >
            <input type='hidden' name='formId' value={formId} />
            {fieldsData.map((field, index) => {
                if ((field as { deleted?: boolean }).deleted) {
                    return null
                }

                return [
                    <div
                        key={index}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={handleDrop}
                        className={`p-4 border border-login-500 rounded-xl bg-login-700 ${
                            draggedIndex === index ? 'opacity-50' : ''
                        }`}
                    >
                        <div className='flex justify-between items-center mb-4'>
                            <h3 className='font-semibold text-login-50'>Field {index + 1}</h3>
                            <div className='flex space-x-2'>
                                <button
                                    type='button'
                                    onClick={() => handleRemove(index)}
                                    className='text-red-500 cursor-pointer hover:bg-login-600 p-1 rounded transition-colors'
                                >
                                    <X size={16} />
                                </button>
                                <button
                                    type='button'
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    className='text-login-50 cursor-move hover:bg-login-600 p-1 rounded transition-colors'
                                >
                                    <GripVertical size={16} />
                                </button>
                            </div>
                        </div>
                        {field.id && <input type='hidden' name={`field_${index}_id`} value={field.id} />}
                        <input
                            type='hidden'
                            name={`field_${index}_operation`}
                            value={(field as { operation?: string }).operation || 'update'}
                        />
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                            <Input
                                name={`field_${index}_title`}
                                type='text'
                                label='Title'
                                value={field.title}
                                onChange={(e) =>
                                    setFieldsData(prev => prev.map((f, i) => i === index ? { ...f, title: e.target.value } : f))}
                                required
                                className='col-span-1 md:col-span-2'
                            />

                            <Select
                                name={`field_${index}_field_type`}
                                label='Field Type'
                                value={field.field_type}
                                onChange={(value) =>
                                    setFieldsData(prev => prev.map((f, i) => i === index ? { ...f, field_type: value as string } : f))
                                }
                                options={fieldTypeOptions}
                                required
                            />

                            <Switch
                                name={`field_${index}_required`}
                                label='Required'
                                checked={field.required}
                                onChange={(e) => setFieldsData(
                                    prev => prev.map((f, i) => i === index ? { ...f, required: e.target.checked } : f)
                                )}
                                switchOnly
                                className='justify-start md:justify-center mt-2 md:mt-0'
                            />
                        </div>


                        <Textarea
                            name={`field_${index}_description`}
                            type='markdown'
                            label='Description'
                            value={field.description || ''}
                            onChange={(e) =>
                                setFieldsData(prev => prev.map((f, i) => i === index ? { ...f, description: e.target.value } : f))}
                            className='col-span-2'
                        />

                        {(field.field_type === 'select' || field.field_type === 'checkbox' || field.field_type === 'radio') && (
                            <div>
                                <label className='block text-sm font-medium text-login-50 mb-2'>Options</label>
                                <div className='space-y-2'>
                                    {Array.isArray(field.options) && field.options.map((option, optionIndex) => (
                                        <div key={optionIndex} className='flex gap-2 items-center'>
                                            <div className='flex-1'>
                                                <input
                                                    type='text'
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...(field.options || [])]
                                                        newOptions[optionIndex] = e.target.value
                                                        setFieldsData(prev => prev.map((f, i) =>
                                                            i === index ? { ...f, options: newOptions } : f
                                                        ))
                                                    }}
                                                    placeholder={`Option ${optionIndex + 1}`}
                                                    className='w-full px-3 py-2 border border-login-500 rounded-md bg-login-700
                                                        text-login-50 focus:outline-none focus:ring-2 focus:login-50
                                                        focus:border-transparent'
                                                />
                                            </div>
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    const newOptions = [...(field.options || [])]
                                                    newOptions.splice(optionIndex, 1)
                                                    setFieldsData(prev => prev.map((f, i) =>
                                                        i === index ? { ...f, options: newOptions } : f
                                                    ))
                                                }}
                                                className='p-2 text-red-500 hover:bg-login-600 rounded transition-colors'
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type='button'
                                        onClick={() => {
                                            const newOptions = [...(field.options || []), '']
                                            setFieldsData(prev => prev.map((f, i) =>
                                                i === index ? { ...f, options: newOptions } : f
                                            ))
                                        }}
                                        className='flex items-center gap-2 text-sm text-login-50 hover:text-white px-3 py-2
                                            rounded hover:bg-login-600 transition-colors'
                                    >
                                        <Plus size={16} />
                                        Add Option
                                    </button>
                                </div>
                                <input
                                    type='hidden'
                                    name={`field_${index}_options`}
                                    value={Array.isArray(field.options) ? field.options.join('\n') : ''}
                                />
                            </div>
                        )}

                        <input type='hidden' name={`field_${index}_field_order`} value={field.field_order} />
                    </div>,
                    <div key={`add-${index}`} className='flex justify-center opacity-0 hover:opacity-100 transition-opacity duration-200'>
                        <button
                            type='button'
                            onClick={() => handleAddFieldAt(index + 1)}
                            className='text-login-50 hover:text-login-300 cursor-pointer
                                rounded-full w-8 h-8 flex items-center justify-center hover:bg-login-600 transition-colors'
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                ]

            })}

            <div className='flex space-x-3 pt-4'>
                <button
                    type='button'
                    onClick={handleAddField}
                    className='px-4 py-2 bg-login-500  rounded-md transition-colors'
                >
                    Add Field
                </button>
                <button
                    type='submit'
                    disabled={loading}
                    className='flex-1 px-4 py-2 bg-login text-login-900 rounded-md
                        hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors focus:outline-none focus:ring-2 focus:ring-login
                        focus:ring-offset-2 focus:ring-offset-login-700 font-medium cursor-pointer'
                >
                    {loading ? 'Saving...' : 'Save Fields'}
                </button>
            </div>
        </form>
    )
}
