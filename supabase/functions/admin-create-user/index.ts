import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const CreateUserSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Некорректный формат email" })
    .max(255, { message: "Email слишком длинный (максимум 255 символов)" }),
  password: z.string()
    .min(6, { message: "Пароль должен быть минимум 6 символов" })
    .max(128, { message: "Пароль слишком длинный (максимум 128 символов)" }),
  name: z.string()
    .trim()
    .min(1, { message: "Имя обязательно" })
    .max(100, { message: "Имя слишком длинное (максимум 100 символов)" }),
  role: z.enum(['admin', 'manager'], { 
    errorMap: () => ({ message: "Роль должна быть 'admin' или 'manager'" })
  }),
  projectAccess: z.array(
    z.string().uuid({ message: "Некорректный формат ID проекта" })
  ).optional().default([]),
  sendEmail: z.boolean().optional().default(false)
});

type CreateUserRequest = z.infer<typeof CreateUserSchema>;

async function sendWelcomeEmail(email: string, name: string, password: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email service not configured" };
  }

  const resend = new Resend(resendApiKey);

  try {
    const { error } = await resend.emails.send({
      from: "AdMetrics <onboarding@resend.dev>",
      to: [email],
      subject: "Добро пожаловать в AdMetrics!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; margin-bottom: 30px; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f8fafc; padding: 30px; border-radius: 12px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .credential-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .credential-row:last-child { border-bottom: none; }
            .label { color: #64748b; font-size: 14px; }
            .value { font-weight: 600; color: #1e293b; font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin-top: 15px; font-size: 13px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 AdMetrics</h1>
            </div>
            <div class="content">
              <h2>Привет, ${name}!</h2>
              <p>Вас добавили в систему AdMetrics. Ниже ваши данные для входа:</p>
              
              <div class="credentials">
                <div class="credential-row">
                  <span class="label">Email:</span>
                  <span class="value">${email}</span>
                </div>
                <div class="credential-row">
                  <span class="label">Пароль:</span>
                  <span class="value">${password}</span>
                </div>
              </div>
              
              <div class="warning">
                ⚠️ <strong>Важно:</strong> Смените пароль сразу после первого входа. Удалите это письмо после использования.
              </div>
              
              <p>С уважением,<br>Команда AdMetrics</p>
            </div>
            <div class="footer">
              <p>Это автоматическое сообщение. Не отвечайте на него.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    console.log("Welcome email sent to:", email);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify that the requester is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Требуется авторизация" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Create client with user's token to check admin status
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get current user
    const { data: { user: currentUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !currentUser) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Неверный токен авторизации" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if current user is admin using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      console.log("User is not admin:", currentUser.id);
      return new Response(
        JSON.stringify({ success: false, error: "Только администраторы могут создавать пользователей" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body using Zod
    const rawBody = await req.json();
    const validationResult = CreateUserSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map(issue => issue.message)
        .join("; ");
      console.log("Validation failed:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessages,
          validationErrors: validationResult.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, name, role, projectAccess, sendEmail } = validationResult.data;

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Пользователь с таким email уже существует" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ success: false, error: createError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user?.id;
    console.log("User created:", userId);

    // Add role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (roleError) {
      console.error("Error adding role:", roleError);
    }

    // Add project access for managers
    if (role === "manager" && projectAccess.length > 0) {
      const accessRecords = projectAccess.map(projectId => ({
        user_id: userId,
        project_id: projectId
      }));

      const { error: accessError } = await supabaseAdmin
        .from("project_access")
        .insert(accessRecords);

      if (accessError) {
        console.error("Error adding project access:", accessError);
      }
    }

    // Send welcome email if requested
    let emailResult: { success: boolean; error?: string } = { success: false, error: "Email not requested" };
    if (sendEmail) {
      emailResult = await sendWelcomeEmail(email, name, password);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Пользователь создан",
        emailSent: sendEmail && emailResult.success,
        emailError: sendEmail && !emailResult.success ? emailResult.error : undefined,
        user: {
          id: userId,
          email,
          name,
          role
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
