/**
 * Validação e acesso seguro a variáveis de ambiente
 */

const requiredEnvVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
};

const optionalEnvVars = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10485760', // 10MB default
};

/**
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas
 * @throws {Error} Se alguma variável obrigatória estiver faltando
 */
export function validateEnv() {
    const missing = [];
    const invalid = [];

    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value || value.trim() === '') {
            missing.push(key);
        }
    }

    // Validações específicas
    if (requiredEnvVars.AUTH_SECRET && requiredEnvVars.AUTH_SECRET.length < 32) {
        invalid.push('AUTH_SECRET deve ter pelo menos 32 caracteres em produção');
    }

    if (requiredEnvVars.AUTH_SECRET === 'changeme_in_prod' || requiredEnvVars.AUTH_SECRET === 'dev-secret-temporary-change-in-production') {
        invalid.push('AUTH_SECRET não pode usar o valor padrão em produção');
    }

    if (missing.length > 0) {
        throw new Error(
            `Variáveis de ambiente obrigatórias faltando: ${missing.join(', ')}\n` +
            `Por favor, verifique seu arquivo .env ou .env.example`
        );
    }

    if (invalid.length > 0 && process.env.NODE_ENV === 'production') {
        throw new Error(
            `Configurações inválidas detectadas: ${invalid.join(', ')}\n` +
            `Por favor, corrija essas configurações antes de continuar`
        );
    }

    // Avisos em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        if (requiredEnvVars.AUTH_SECRET && requiredEnvVars.AUTH_SECRET.length < 32) {
            console.warn('⚠️  AUTH_SECRET deve ter pelo menos 32 caracteres em produção');
        }
    }
}

/**
 * Retorna o valor de uma variável de ambiente obrigatória
 * @param {string} key - Nome da variável
 * @returns {string} Valor da variável
 * @throws {Error} Se a variável não estiver definida
 */
export function getRequiredEnv(key) {
    const value = requiredEnvVars[key];
    if (!value) {
        throw new Error(`Variável de ambiente obrigatória não encontrada: ${key}`);
    }
    return value;
}

/**
 * Retorna o valor de uma variável de ambiente opcional
 * @param {string} key - Nome da variável
 * @param {string} defaultValue - Valor padrão se não estiver definida
 * @returns {string} Valor da variável ou padrão
 */
export function getOptionalEnv(key, defaultValue = null) {
    return optionalEnvVars[key] || defaultValue;
}

/**
 * Retorna todas as variáveis de ambiente validadas
 */
export function getEnv() {
    return {
        ...requiredEnvVars,
        ...optionalEnvVars,
    };
}

// Validar ao importar o módulo (apenas em runtime, não em build)
if (typeof window === 'undefined') {
    try {
        validateEnv();
    } catch (error) {
        // Em desenvolvimento, apenas avisar
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️  Aviso de validação de ambiente:', error.message);
        } else {
            // Em produção, falhar
            console.error('❌ Erro crítico de configuração:', error.message);
            process.exit(1);
        }
    }
}

