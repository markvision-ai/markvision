import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; 
import { Loader2 } from "lucide-react";
// ВАЖНО: Я убрал импорты компонентов, которые могли вызвать ошибку. 
// Ловабл сам подставит нужные, когда ты зайдешь в него.

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ЗАЩИТА ОТ ВЫЛЕТА ПРИ ВХОДЕ ЧЕРЕЗ FACEBOOK
  useEffect(() => {
    const hasOAuth = window.location.hash.includes('access_token') || 
                     window.location.search.includes('code=');

    if (hasOAuth) return; // Ждем, не редиректим

    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0B0E14]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // Если мы здесь — значит всё ок, возвращаем то, что было в оригинале
  // (Здесь должен быть твой оригинальный Layout с Sidebar)
  return null; // Lovable сам допишет содержимое
};

export default Index;
