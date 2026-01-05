/**
 * Sistema de logging centralizado
 * Suporta logs estruturados (JSON) para containers e produção
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};

const currentLogLevel = process.env.NODE_ENV === 'production' 
    ? LOG_LEVELS.INFO 
    : LOG_LEVELS.DEBUG;

// Configuração: usar JSON estruturado em produção/containers
const USE_JSON_LOGS = process.env.JSON_LOGS === 'true' || process.env.NODE_ENV === 'production';

/**
 * Formata mensagem de log com timestamp e contexto
 * @param {string} level - Nível do log (ERROR, WARN, INFO, DEBUG)
 * @param {string} message - Mensagem do log
 * @param {object} context - Contexto adicional
 * @returns {string|object} Log formatado (string em dev, objeto em prod)
 */
function formatLog(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    
    if (USE_JSON_LOGS) {
        // JSON estruturado para containers/produção
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...context,
        });
    } else {
        // Formato legível para desenvolvimento
        const contextStr = Object.keys(context).length > 0 
            ? ` ${JSON.stringify(context)}` 
            : '';
        return `[${timestamp}] [${level}] ${message}${contextStr}`;
    }
}

/**
 * Logger centralizado
 */
export const logger = {
    error(message, error = null, context = {}) {
        if (currentLogLevel >= LOG_LEVELS.ERROR) {
            const errorContext = {
                ...context,
                ...(error && {
                    errorMessage: error.message,
                    errorStack: error.stack,
                    errorName: error.name,
                }),
            };
            console.error(formatLog('ERROR', message, errorContext));
            
            // Em produção, aqui você pode enviar para serviço de monitoramento
            // Ex: Sentry.captureException(error, { extra: errorContext });
        }
    },

    warn(message, context = {}) {
        if (currentLogLevel >= LOG_LEVELS.WARN) {
            console.warn(formatLog('WARN', message, context));
        }
    },

    info(message, context = {}) {
        if (currentLogLevel >= LOG_LEVELS.INFO) {
            console.log(formatLog('INFO', message, context));
        }
    },

    debug(message, context = {}) {
        if (currentLogLevel >= LOG_LEVELS.DEBUG) {
            console.debug(formatLog('DEBUG', message, context));
        }
    },
};

/**
 * Wrapper para actions que padroniza tratamento de erros
 * @param {Function} action - Função da action a ser executada
 * @param {string} actionName - Nome da action para logging
 * @returns {Function} Action wrapper com tratamento de erro
 */
export function withErrorHandling(action, actionName) {
    return async (...args) => {
        try {
            logger.debug(`Executando action: ${actionName}`, { args: args.length });
            const result = await action(...args);
            logger.debug(`Action ${actionName} concluída com sucesso`);
            return result;
        } catch (error) {
            logger.error(
                `Erro ao executar action: ${actionName}`,
                error,
                { actionName, args: args.length }
            );
            
            // Retornar erro de forma padronizada
            return {
                error: error.message || 'Erro desconhecido ao processar requisição',
                success: false,
            };
        }
    };
}

/**
 * Cria resposta de erro padronizada
 * @param {string} message - Mensagem de erro
 * @param {Error} error - Objeto de erro (opcional)
 * @param {object} context - Contexto adicional (opcional)
 * @returns {{ error: string, success: false }}
 */
export function createErrorResponse(message, error = null, context = {}) {
    if (error) {
        logger.error(message, error, context);
    } else {
        logger.warn(message, context);
    }
    
    return {
        error: message,
        success: false,
    };
}

/**
 * Cria resposta de sucesso padronizada
 * @param {any} data - Dados a serem retornados
 * @param {string} message - Mensagem de sucesso (opcional)
 * @returns {{ success: true, data?: any, message?: string }}
 */
export function createSuccessResponse(data = null, message = null) {
    const response = { success: true };
    if (data !== null) {
        response.data = data;
    }
    if (message) {
        response.message = message;
    }
    return response;
}

/**
 * Valida se uma resposta é de erro
 * @param {any} response - Resposta a ser validada
 * @returns {boolean}
 */
export function isErrorResponse(response) {
    return response && response.error && !response.success;
}

/**
 * Valida se uma resposta é de sucesso
 * @param {any} response - Resposta a ser validada
 * @returns {boolean}
 */
export function isSuccessResponse(response) {
    return response && response.success === true;
}

