'use server'

import { patchFields } from '@utils/api'
import {
    getRequiredString,
    getOptionalString,
    getRequiredNumber,
    getBoolean
} from '@utils/validate'

type FormState =
    | null
    | string

type FieldsState = FormState

function extractFieldProps(formData: FormData, index: number): FieldProps {
    return {
        form_id: getRequiredString(formData, 'formId'),
        field_type:     getRequiredString(formData, `field_${index}_field_type`),
        title:          getRequiredString(formData, `field_${index}_title`),
        description:    getOptionalString(formData, `field_${index}_description`),
        required:       getBoolean(formData, `field_${index}_required`),
        options:        getOptionalString(formData, `field_${index}_options`)
            ? getRequiredString(formData, `field_${index}_options`).split('\n').map(s => s.trim()).filter(Boolean)
            : null,
        validation:     getOptionalString(formData, `field_${index}_validation`)
            ? JSON.parse(getRequiredString(formData, `field_${index}_validation`))
            : null,
        field_order:    getRequiredNumber(formData, `field_${index}_field_order`)
    }
}

export async function updateFields(_: FieldsState, formData: FormData): Promise<FieldsState> {
    try {
        const formId = getRequiredString(formData, 'formId')
        const fields: PatchFieldsProps = []

        // Collect all field data
        const fieldIndices = new Set<number>()
        for (const key of formData.keys()) {
            if (key.startsWith('field_')) {
                const parts = key.split('_')
                const index = Number(parts[1])
                fieldIndices.add(index)
            }
        }

        for (const index of fieldIndices) {
            const operation = getRequiredString(formData, `field_${index}_operation`)
            const id = getOptionalString(formData, `field_${index}_id`) ?? undefined

            if (operation === 'delete') {
                fields.push({
                    operation: 'delete',
                    id,
                    data: {} as FieldProps
                })
            } else {
                const data = extractFieldProps(formData, index)
                fields.push({
                    operation: operation as 'create' | 'update',
                    id: operation === 'create' ? undefined : id,
                    data: data
                })
            }
        }

        await patchFields(formId, fields)
        return null
    } catch (error) {
        return error instanceof Error ? error.message : 'Unknown error'
    }
}
