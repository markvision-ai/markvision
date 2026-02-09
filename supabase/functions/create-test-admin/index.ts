import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const allowTestAdminCreation = Deno.env.get("ALLOW_TEST_ADMIN_CREATION") === "true";
    if (!allowTestAdminCreation) {
      return new Response(
        JSON.stringify({ success: false, error: "create-test-admin is disabled" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
    const requester = authData.user;
    if (authError || !requester) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: requesterRole, error: roleCheckError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleCheckError || !requesterRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: super_admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = "testadmin@markvision.app";
    const password = "TestAdmin123!";
    const name = "Test Admin";

    // Check and delete existing user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log("Deleting existing user:", existingUser.id);
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      
      // Clean up old records
      await supabaseAdmin.from("user_roles").delete().eq("user_id", existingUser.id);
      await supabaseAdmin.from("project_access").delete().eq("user_id", existingUser.id);
      await supabaseAdmin.from("profiles").delete().eq("user_id", existingUser.id);
    }

    // Create new user with password
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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user?.id;
    console.log("User created:", userId);

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    if (roleError) {
      console.error("Error adding role:", roleError);
    }

    // Get all projects
    const { data: projects } = await supabaseAdmin.from("projects").select("id, name");
    console.log("Projects found:", projects?.length);

    // Grant access to all projects
    if (projects && projects.length > 0) {
      for (const project of projects) {
        const { error: accessError } = await supabaseAdmin
          .from("project_access")
          .upsert(
            { user_id: userId, project_id: project.id },
            { onConflict: "user_id,project_id" }
          );
        
        if (accessError) {
          console.error(`Error adding access to project ${project.id}:`, accessError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test admin created successfully!",
        credentials: {
          email,
          password
        },
        userId,
        projectsAccess: projects?.map(p => p.name) || []
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
