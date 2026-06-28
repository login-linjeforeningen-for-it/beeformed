'use client'

import { useState, useRef } from 'react'
import { Button, Input, Select, Switch, TagInput, Textarea, toast } from 'uibee/components'
import { GripVertical, X, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { patchTemplateFields } from '@utils/api/client'

export default function EditTemplateFieldsPage({ fields, templateId }: { fields: GetFieldsProps; templateId: string }) {
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
        const newField = {
            id: null,
            title: '',
            description: '',
            field_type: 'text',
            required: false,
            options: null,
            field_order: fieldsData.length + 1,
            operation: 'create'
        }
        setFieldsData(prev => [...prev, newField as unknown as GetFieldProps])
    }

    function handleAddFieldAt(position: number) {
        const newField = {
            id: null,
            title: '',
            description: '',
            field_type: 'text',
            required: false,
            options: null,
            field_order: position + 1,
            operation: 'create'
        }
        setFieldsData(prev => {
            const newFields = [...prev]
            newFields.splice(position, 0, newField as unknown as GetFieldProps)
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
            const operations: PatchTemplateFieldsProps = []

            for (const field of fieldsData as (GetFieldProps & { deleted?: boolean })[]) {
                if (field.deleted) {
                    if (field.id) {
                        operations.push({
                            operation: 'delete',
                            id: field.id,
                            data: {} as TemplateFieldProps
                        })
                    }
                    continue
                }

                const data: TemplateFieldProps = {
                    template_id: templateId,
                    field_type: field.field_type,
                    title: field.title,
                    description: field.description,
                    required: field.required,
                    options: field.options,
                    field_order: field.field_order
                }

                if (field.id) {
                    operations.push({
                        operation: 'update',
                        id: field.id,
                        data
                    })
                } else {
                    operations.push({
                        operation: 'create',
                        data
                    })
                }
            }

            await patchTemplateFields(templateId, operations)
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
            {fieldsData.map((field, index) => {
                if ((field as { deleted?: boolean }).deleted) {
                    return null
                }

                return [
                    <div
                        key={index}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={handleDrop}
                        className={`rounded-xl border border-login-500 bg-login-700 p-4 ${
                            draggedIndex === index ? 'opacity-50' : ''
                        }`}
                    >
                        <div className='mb-4 flex items-center justify-between'>
                            <h3 className='font-semibold text-login-50'>Field {index + 1}</h3>
                            <div className='flex space-x-2'>
                                <button
                                    type='button'
                                    onClick={() => handleRemove(index)}
                                    className='flex min-h-9 min-w-9 cursor-pointer items-center
                                        justify-center rounded p-2 text-red-500 transition-colors hover:bg-login-600'
                                >
                                    <X size={16} />
                                </button>
                                <button
                                    type='button'
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    className='flex min-h-9 min-w-9 cursor-move items-center
                                        justify-center rounded p-2 text-login-50 transition-colors hover:bg-login-600'
                                >
                                    <GripVertical size={16} />
                                </button>
                            </div>
                        </div>
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
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
                                className='mt-2 justify-start md:mt-0 md:justify-center'
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
                            <TagInput
                                name={`field_${index}_options`}
                                label='Options'
                                value={Array.isArray(field.options) ? field.options : []}
                                onChange={(value) => setFieldsData(prev => prev.map((f, i) =>
                                    i === index ? { ...f, options: value } : f
                                ))}
                                placeholder='Add option and press Enter...'
                            />
                        )}
                    </div>,
                    <div key={`add-${index}`} className='flex justify-center opacity-0 transition-opacity duration-200 hover:opacity-100'>
                        <button
                            type='button'
                            onClick={() => handleAddFieldAt(index + 1)}
                            className='flex size-11 cursor-pointer
                                items-center justify-center rounded-full text-login-50
                                transition-colors hover:bg-login-600 hover:text-login-300'
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                ]

            })}

            <div className='flex space-x-3 pt-4'>
                <Button
                    text='Add Field'
                    type='button'
                    onClick={handleAddField}
                    variant='secondary'
                />
                <Button
                    text={loading ? 'Saving...' : 'Save Fields'}
                    type='submit'
                    disabled={loading}
                    variant='primary'
                    className='flex-1'
                />
            </div>
        </form>
    )
}
