/**
 * Schemas de validação centralizados usando Zod
 */

import { z } from 'zod';

// Schemas auxiliares reutilizáveis
export const documentSchema = z.string().refine(
    (val) => {
        const clean = val.replace(/\D/g, '');
        return clean.length === 11 || clean.length === 14;
    },
    { message: 'Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)' }
);

export const emailSchema = z.string().email({ message: 'Email inválido' });

export const optionalEmailSchema = z.union([
    z.string().email({ message: 'Email inválido' }),
    z.literal('')
]).optional().nullable();

export const phoneSchema = z.string().optional().refine(
    (val) => !val || val.replace(/\D/g, '').length >= 10,
    { message: 'Telefone inválido' }
);

export const cepSchema = z.string().optional().refine(
    (val) => !val || val.replace(/\D/g, '').length === 8,
    { message: 'CEP inválido' }
);

export const currencySchema = z.coerce.number().min(0, { message: 'Valor deve ser positivo' });

// Helper for optional dates that might come as empty strings
export const optionalDateSchema = z.preprocess(
    (val) => (val === '' ? null : val),
    z.coerce.date().optional().nullable()
);

export const positiveIntegerSchema = z.coerce.number().int().min(0, { message: 'Deve ser um número inteiro positivo' });

// Schemas de validação para entidades principais

// Schema para Certificações (usado dentro do clientSchema ou separadamente)
export const clientCertificationSchema = z.object({
    id: z.number().optional(), // For updates
    name: z.string().min(1, "Nome do documento é obrigatório"),
    code: z.string().optional(),
    technicianId: z.string().optional().nullable(), // Form might send as string "123"
    issuedAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    alertDays: z.coerce.number().min(1).default(30),
});

export const clientSchema = z.object({
    // Identificação
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    tradeName: z.string().optional(),
    document: z.string().min(11, "Documento inválido"), // Basic validation, refined later
    personType: z.enum(["PF", "PJ"]),
    stateRegistry: z.string().optional(),
    cityRegistry: z.string().optional(),
    cnae: z.string().optional(),
    taxRegime: z.string().optional(),
    // logoUrl: z.string().optional().nullable(), // To act later if needed

    // Endereço
    zipCode: z.string().min(8, "CEP inválido").optional().or(z.literal('')),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().min(2, "Cidade obrigatória"),
    state: z.string().length(2, "Estado inválido"),

    // Contato
    phonePrimary: z.string().optional(),
    phoneSecondary: z.string().optional(),
    whatsapp: z.string().optional(),
    emailPrimary: optionalEmailSchema,
    emailSecondary: optionalEmailSchema,

    // Responsável Técnico
    techName: z.string().optional(),
    techDocument: z.string().optional(),
    techClassId: z.string().optional(),
    techContact: z.string().optional(),

    // Financeiro
    segment: z.string().optional(),
    creditLimit: z.coerce.number().min(0).optional(),
    paymentTerms: z.string().optional(),
    bankName: z.string().optional(),
    bankAgency: z.string().optional(),
    bankAccount: z.string().optional(),
    pixKey: z.string().optional(),

    // Configurações
    observations: z.string().optional(),
    // operatingHours e notificationSettings serão tratados como JSON string ou objetos dependendo do ponto
    operatingHours: z.string().optional().nullable(),
    notificationSettings: z.string().optional().nullable(),

    isActive: z.boolean().optional().default(true),

    // Certificações (Array opcional para criação)
    certifications: z.array(clientCertificationSchema).optional(),
});

export const equipmentSchema = z.object({
    name: z.string().min(1, { message: 'Nome é obrigatório' }).max(255),
    brand: z.string().min(1, { message: 'Marca é obrigatória' }).max(255),
    model: z.string().min(1, { message: 'Modelo é obrigatório' }).max(255),
    serialNumber: z.string().max(255).optional().nullable(),
    patrimony: z.string().max(255).optional().nullable(),
    voltage: z.string().max(50).optional().nullable(),
    power: z.string().max(50).optional().nullable(),
    manufactureDate: optionalDateSchema,
    purchaseDate: optionalDateSchema,
    warrantyEnd: optionalDateSchema,
    isWarranty: z.boolean().optional().default(false),
    location: z.string().max(255).optional().nullable(),
    status: z.enum(['active', 'maintenance', 'inactive']).optional().default('active'),
    clientId: positiveIntegerSchema,
});

export const serviceSchema = z.object({
    // ... (kept as is)
    code: z.string().max(50).optional().nullable(),
    name: z.string().min(1, { message: 'Nome é obrigatório' }).max(255),
    description: z.string().optional().nullable(),
    category: z.string().max(255).optional().nullable(),
    price: currencySchema,
    priceType: z.enum(['FIXED', 'HOURLY']).optional().default('FIXED'),
    serviceCode: z.string().max(50).optional().nullable(),
    estimatedMinutes: positiveIntegerSchema.optional().nullable(),
    requiresChecklist: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
});

export const partSchema = z.object({
    // ... (kept as is)
    name: z.string().min(1, { message: 'Nome é obrigatório' }).max(255),
    description: z.string().optional().nullable(),
    sku: z.string().max(100).optional().nullable(),
    partNumber: z.string().max(100).optional().nullable(),
    brand: z.string().max(255).optional().nullable(),
    model: z.string().max(255).optional().nullable(),
    ncm: z.string().max(20).optional().nullable(),
    costPrice: currencySchema,
    salePrice: currencySchema,
    stockQuantity: positiveIntegerSchema,
    minStock: positiveIntegerSchema,
    maxStock: positiveIntegerSchema.optional().nullable(),
    location: z.string().max(255).optional().nullable(),
    unit: z.string().max(10).optional().default('UN'),
    category: z.string().max(255).optional().nullable(),
    isActive: z.boolean().optional().default(true),
});

export const technicianSchema = z.object({
    name: z.string().min(1, { message: 'Nome é obrigatório' }).max(255),
    email: optionalEmailSchema,
    phone: phoneSchema,
    whatsapp: phoneSchema,
    document: z.string().max(20).optional().nullable(),
    professionalId: z.string().max(50).optional().nullable(),
    specialty: z.string().max(255).optional().nullable(),
    certifications: z.string().optional().nullable(),
    hireDate: optionalDateSchema,
    costPerHour: currencySchema.optional().default(0),
    isActive: z.boolean().optional().default(true),
});

export const serviceOrderSchema = z.object({
    clientId: positiveIntegerSchema,
    equipmentId: positiveIntegerSchema.optional().nullable(),
    technicianId: positiveIntegerSchema.optional().nullable(),
    type: z.enum(['CORRECTIVE', 'PREVENTIVE', 'INSTALLATION', 'CALIBRATION']).optional().default('CORRECTIVE'),
    maintenanceArea: z.enum(['ELECTRONICS', 'SERVOMOTOR', 'HYDRAULICS', 'PNEUMATICS', 'PLC', 'GENERAL', 'TECHNICAL_ASSISTANCE']).optional().default('GENERAL'),
    origin: z.enum(['PHONE', 'WHATSAPP', 'PRESENTIAL']).optional().nullable(),
    requesterName: z.string().max(255).optional().nullable(),
    requesterPhone: phoneSchema,
    serviceLocation: z.enum(['INTERNAL', 'EXTERNAL']).optional().default('INTERNAL'),
    serviceAddress: z.string().max(500).optional().nullable(),
    serviceZipCode: z.string().max(20).optional().nullable(),
    serviceStreet: z.string().max(255).optional().nullable(),
    serviceNumber: z.string().max(50).optional().nullable(),
    serviceComplement: z.string().max(255).optional().nullable(),
    serviceNeighborhood: z.string().max(255).optional().nullable(),
    serviceCity: z.string().max(255).optional().nullable(),
    serviceState: z.string().max(10).optional().nullable(),
    serviceReference: z.string().max(500).optional().nullable(),
    externalEquipmentDescription: z.string().max(500).optional().nullable(),
    entryInvoiceNumber: z.string().max(100).optional().nullable(),
    accessories: z.string().max(500).optional().nullable(),
    equipmentSerialNumber: z.string().max(255).optional().nullable(),
    status: z.string().optional().default('OPEN'),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
    scheduledAt: optionalDateSchema,
    reportedDefect: z.string().min(1, { message: 'Defeito relatado é obrigatório' }),
    diagnosis: z.string().optional().nullable(),
    solution: z.string().optional().nullable(),
    internalNotes: z.string().optional().nullable(),
    warrantyUntil: optionalDateSchema,
    laborHours: currencySchema.optional().default(0),
    laborCost: currencySchema.optional().default(0),
    displacement: currencySchema.optional().default(0),
    discount: currencySchema.optional().default(0),
});

export const userSchema = z.object({
    name: z.string().min(1, { message: 'Nome é obrigatório' }).max(255),
    username: z.string().min(3, { message: 'Usuário deve ter no mínimo 3 caracteres' }).max(50),
    email: optionalEmailSchema,
    password: z.string()
        .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
        .regex(/[A-Z]/, { message: 'Senha deve conter pelo menos uma letra maiúscula' })
        .regex(/[a-z]/, { message: 'Senha deve conter pelo menos uma letra minúscula' })
        .regex(/[0-9]/, { message: 'Senha deve conter pelo menos um número' })
        .optional()
        .or(z.literal('')), // Permite string vazia para atualizações sem mudança de senha
    role: z.enum(['ADMIN', 'BACKOFFICE', 'TECH_INTERNAL', 'TECH_FIELD']).optional().default('TECH_FIELD'),
    technicianId: positiveIntegerSchema.optional().nullable(),
    specialties: z.union([
        z.string().optional().nullable(), // JSON string from form
        z.array(z.string()).optional() // Array from form processing
    ]).optional().nullable(),
    isActive: z.boolean().optional().default(true),
});

export const stockMovementSchema = z.object({
    partId: positiveIntegerSchema,
    quantity: positiveIntegerSchema,
    type: z.enum(['IN', 'OUT'], { message: 'Tipo deve ser IN ou OUT' }),
    reason: z.enum(['PURCHASE', 'ADJUSTMENT', 'SERVICE_ORDER', 'RETURN']).optional().nullable(),
    unitCost: currencySchema.optional().nullable(),
    serviceOrderId: positiveIntegerSchema.optional().nullable(),
});

/**
 * Valida dados usando um schema Zod
 * @param {z.ZodSchema} schema - Schema Zod para validação
 * @param {any} data - Dados a serem validados
 * @returns {{ success: true, data: any } | { success: false, error: string, errors: z.ZodError }}
 */
export function validate(schema, data) {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = (error.errors || []).map(err => ({
                path: err.path.join('.'),
                message: err.message,
            }));
            return {
                success: false,
                error: errors[0]?.message || 'Existem campos inválidos. Verifique o formulário.',
                errors,
            };
        }
        return {
            success: false,
            error: error.message || 'Erro desconhecido na validação',
            errors: [],
        };
    }
}

/**
 * Sanitiza string removendo caracteres perigosos
 * @param {string} str - String a ser sanitizada
 * @returns {string} String sanitizada
 */
export function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Sanitiza objeto recursivamente
 * @param {any} obj - Objeto a ser sanitizado
 * @returns {any} Objeto sanitizado
 */
export function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}

