import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HealthCheckResult {
    serviceId: string;
    serviceName: string;
    serviceType: string;
    status: 'operational' | 'degraded' | 'error';
    errorMessage?: string;
    metadata?: Record<string, unknown>;
    responseTime?: number;
}

export interface SystemAlert {
    serviceId: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
}

/**
 * Check Facebook Ads API health
 */
export async function checkFacebookIntegration(
    projectId: string,
    config: any
): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        if (!config?.access_token) {
            return {
                serviceId: 'facebook',
                serviceName: 'Facebook Marketing API',
                serviceType: 'facebook',
                status: 'error',
                errorMessage: 'Access token not configured',
            };
        }

        // Test Facebook API by fetching user info
        const response = await fetch(
            `https://graph.facebook.com/v18.0/me?access_token=${config.access_token}&fields=id,name`
        );

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            const error = await response.json();
            return {
                serviceId: 'facebook',
                serviceName: 'Facebook Marketing API',
                serviceType: 'facebook',
                status: 'error',
                errorMessage: error.error?.message || 'API request failed',
                responseTime,
            };
        }

        const data = await response.json();

        return {
            serviceId: 'facebook',
            serviceName: 'Facebook Marketing API',
            serviceType: 'facebook',
            status: 'operational',
            metadata: { userId: data.id, userName: data.name },
            responseTime,
        };
    } catch (error) {
        return {
            serviceId: 'facebook',
            serviceName: 'Facebook Marketing API',
            serviceType: 'facebook',
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - startTime,
        };
    }
}

/**
 * Check WhatsApp GreenAPI health
 */
export async function checkWhatsAppIntegration(
    projectId: string,
    config: any
): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        if (!config?.instance_id || !config?.token) {
            return {
                serviceId: 'whatsapp',
                serviceName: 'WhatsApp Gateway',
                serviceType: 'whatsapp',
                status: 'error',
                errorMessage: 'Instance ID or token not configured',
            };
        }

        // Test GreenAPI by getting instance state
        const response = await fetch(
            `https://api.green-api.com/waInstance${config.instance_id}/getStateInstance/${config.token}`
        );

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            return {
                serviceId: 'whatsapp',
                serviceName: 'WhatsApp Gateway',
                serviceType: 'whatsapp',
                status: 'error',
                errorMessage: 'Failed to connect to GreenAPI',
                responseTime,
            };
        }

        const data = await response.json();

        if (data.stateInstance === 'authorized') {
            return {
                serviceId: 'whatsapp',
                serviceName: 'WhatsApp Gateway',
                serviceType: 'whatsapp',
                status: 'operational',
                metadata: { state: data.stateInstance },
                responseTime,
            };
        } else {
            return {
                serviceId: 'whatsapp',
                serviceName: 'WhatsApp Gateway',
                serviceType: 'whatsapp',
                status: 'degraded',
                errorMessage: `Instance state: ${data.stateInstance}`,
                metadata: { state: data.stateInstance },
                responseTime,
            };
        }
    } catch (error) {
        return {
            serviceId: 'whatsapp',
            serviceName: 'WhatsApp Gateway',
            serviceType: 'whatsapp',
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - startTime,
        };
    }
}

/**
 * Check Telegram Bot health
 */
export async function checkTelegramIntegration(
    projectId: string,
    config: any
): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        if (!config?.bot_token) {
            return {
                serviceId: 'telegram',
                serviceName: 'Telegram Bot',
                serviceType: 'telegram',
                status: 'error',
                errorMessage: 'Bot token not configured',
            };
        }

        // Test Telegram Bot API
        const response = await fetch(
            `https://api.telegram.org/bot${config.bot_token}/getMe`
        );

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            return {
                serviceId: 'telegram',
                serviceName: 'Telegram Bot',
                serviceType: 'telegram',
                status: 'error',
                errorMessage: 'Failed to connect to Telegram API',
                responseTime,
            };
        }

        const data = await response.json();

        if (data.ok) {
            return {
                serviceId: 'telegram',
                serviceName: 'Telegram Bot',
                serviceType: 'telegram',
                status: 'operational',
                metadata: { botName: data.result.username },
                responseTime,
            };
        } else {
            return {
                serviceId: 'telegram',
                serviceName: 'Telegram Bot',
                serviceType: 'telegram',
                status: 'error',
                errorMessage: data.description || 'Bot verification failed',
                responseTime,
            };
        }
    } catch (error) {
        return {
            serviceId: 'telegram',
            serviceName: 'Telegram Bot',
            serviceType: 'telegram',
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - startTime,
        };
    }
}

/**
 * Check Supabase Database health
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        // Simple query to test database connection
        const { error } = await supabase
            .from('projects')
            .select('id')
            .limit(1);

        const responseTime = Date.now() - startTime;

        if (error) {
            return {
                serviceId: 'database',
                serviceName: 'Database Connection',
                serviceType: 'database',
                status: 'error',
                errorMessage: error.message,
                responseTime,
            };
        }

        return {
            serviceId: 'database',
            serviceName: 'Database Connection',
            serviceType: 'database',
            status: 'operational',
            responseTime,
        };
    } catch (error) {
        return {
            serviceId: 'database',
            serviceName: 'Database Connection',
            serviceType: 'database',
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - startTime,
        };
    }
}

/**
 * Check Supabase Realtime health
 */
export async function checkRealtimeHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
        // Test realtime by creating a temporary channel
        const channel = supabase.channel('health-check-test');

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Realtime connection timeout'));
            }, 5000);

            channel
                .on('presence', { event: 'sync' }, () => {
                    clearTimeout(timeout);
                    resolve();
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        clearTimeout(timeout);
                        resolve();
                    }
                });
        });

        await supabase.removeChannel(channel);

        const responseTime = Date.now() - startTime;

        return {
            serviceId: 'realtime',
            serviceName: 'Realtime Subscriptions',
            serviceType: 'realtime',
            status: 'operational',
            responseTime,
        };
    } catch (error) {
        return {
            serviceId: 'realtime',
            serviceName: 'Realtime Subscriptions',
            serviceType: 'realtime',
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            responseTime: Date.now() - startTime,
        };
    }
}

/**
 * Run all health checks for a project
 */
export async function runHealthChecks(projectId: string): Promise<HealthCheckResult[]> {
    try {
        // Fetch all integrations for the project
        const { data: integrations } = await supabase
            .from('integrations')
            .select('*')
            .eq('project_id', projectId)
            .eq('status', 'active');

        const results: HealthCheckResult[] = [];

        // Check each integration
        if (integrations) {
            for (const integration of integrations) {
                let result: HealthCheckResult;

                switch (integration.type) {
                    case 'facebook':
                    case 'instagram': {
                        const fbConfig = integration.config ?? (integration.access_token ? { access_token: integration.access_token } : null);
                        result = await checkFacebookIntegration(projectId, fbConfig);
                        break;
                    }
                    case 'greenapi':
                    case 'whatsapp':
                        result = await checkWhatsAppIntegration(projectId, integration.config);
                        break;
                    case 'telegram':
                        result = await checkTelegramIntegration(projectId, integration.config);
                        break;
                    default:
                        continue;
                }

                results.push(result);

                // Update system_health table
                await updateSystemHealth(projectId, result);

                // Create or resolve alerts based on status
                await manageAlerts(projectId, result);
            }
        }

        // Always check database and realtime
        const dbResult = await checkDatabaseHealth();
        const realtimeResult = await checkRealtimeHealth();

        results.push(dbResult, realtimeResult);

        await updateSystemHealth(projectId, dbResult);
        await updateSystemHealth(projectId, realtimeResult);
        await manageAlerts(projectId, dbResult);
        await manageAlerts(projectId, realtimeResult);

        return results;
    } catch (error) {
        console.error('Error running health checks:', error);
        return [];
    }
}

/**
 * Update system_health table with check result
 */
async function updateSystemHealth(
    projectId: string,
    result: HealthCheckResult
): Promise<void> {
    try {
        await supabase
            .from('system_health')
            .upsert({
                project_id: projectId,
                service_name: result.serviceName,
                service_type: result.serviceType,
                status: result.status,
                last_check_at: new Date().toISOString(),
                error_message: result.errorMessage || null,
                metadata: result.metadata || null,
            }, {
                onConflict: 'project_id,service_type',
            });
    } catch (error) {
        console.error('Error updating system health:', error);
    }
}

/**
 * Create or resolve alerts based on health check results
 */
async function manageAlerts(
    projectId: string,
    result: HealthCheckResult
): Promise<void> {
    try {
        // Get the service_id from system_health
        const { data: healthRecord } = await supabase
            .from('system_health')
            .select('id')
            .eq('project_id', projectId)
            .eq('service_type', result.serviceType)
            .single();

        if (!healthRecord) return;

        if (result.status === 'error') {
            // Check if alert already exists
            const { data: existingAlert } = await supabase
                .from('system_alerts')
                .select('id')
                .eq('service_id', healthRecord.id)
                .eq('is_resolved', false)
                .single();

            if (!existingAlert) {
                // Create new alert
                await createAlert({
                    serviceId: healthRecord.id,
                    title: `${result.serviceName} недоступен`,
                    description: result.errorMessage || 'Сервис не отвечает на запросы',
                    severity: 'critical',
                });

                // Show toast notification
                toast.error(`${result.serviceName} недоступен`, {
                    description: result.errorMessage,
                });
            }
        } else if (result.status === 'operational') {
            // Auto-resolve any existing alerts
            await resolveAlerts(healthRecord.id);
        }
    } catch (error) {
        console.error('Error managing alerts:', error);
    }
}

/**
 * Create a system alert
 */
export async function createAlert(alert: SystemAlert): Promise<void> {
    try {
        await supabase
            .from('system_alerts')
            .insert({
                service_id: alert.serviceId,
                title: alert.title,
                description: alert.description,
                severity: alert.severity,
                is_resolved: false,
                created_at: new Date().toISOString(),
            });
    } catch (error) {
        console.error('Error creating alert:', error);
    }
}

/**
 * Resolve all alerts for a service
 */
export async function resolveAlerts(serviceId: string): Promise<void> {
    try {
        await supabase
            .from('system_alerts')
            .update({
                is_resolved: true,
                resolved_at: new Date().toISOString(),
            })
            .eq('service_id', serviceId)
            .eq('is_resolved', false);
    } catch (error) {
        console.error('Error resolving alerts:', error);
    }
}
