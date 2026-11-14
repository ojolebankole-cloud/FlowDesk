import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthUser } from '../services/auth';
import { ApiError } from '../services/api';
interface AuthContextValue { user: AuthUser|null; loading: boolean; setUser:(user:AuthUser|null)=>void; refresh:()=>Promise<void> }
const AuthContext=createContext<AuthContextValue|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}) {
 const [user,setUser]=useState<AuthUser|null>(null); const [loading,setLoading]=useState(true);
 const refresh=async()=>{try{const result=await authService.me();setUser(result.user)}catch(error){if(error instanceof ApiError&&error.status===401)setUser(null);else if(!(error instanceof TypeError))console.error(error)}finally{setLoading(false)}};
 useEffect(()=>{void refresh()},[]);
 return <AuthContext.Provider value={{user,loading,setUser,refresh}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used within AuthProvider');return value;}
