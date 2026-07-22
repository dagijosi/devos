import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/ui/forms/Input';
import Button from '../components/ui/forms/Button';
import DemoAccountModal from '../components/auth/DemoAccountModal';
import { useAuthStore, type User } from '../store/authStore';
import { DASHBOARD, SIGNUP } from '../routes/types/routeConstants';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockUser: User = {
        id: 'user-123',
        name: 'John Doe',
        email: data.email,
        role: 'User',
        permissions: ['view_dashboard'],
        businessModules: ['Dashboard'],
      };
      setAuth('mock-token', mockUser);
      setIsLoading(false);
      toast.success('Welcome back!');
      navigate(DASHBOARD);
    }, 1500);
  };

  const handleDemoSelect = (user: User) => {
    setAuth('demo-token', user);
    setIsDemoModalOpen(false);
    toast.success(`Logged in as ${user.name}`);
    navigate(DASHBOARD);
  };

  const handleGoogleLogin = () => {
    toast.info('Google login is not implemented in this demo');
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email Address"
          placeholder="name@company.com"
          leftIcon={<Mail size={18} />}
          {...register('email')}
          error={errors.email?.message}
        />
        
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
          showPasswordToggle
          {...register('password')}
          error={errors.password?.message}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              {...register('rememberMe')}
              className="w-4 h-4 rounded border-theme-border text-theme-icon focus:ring-theme-icon bg-theme-background" 
            />
            <span className="text-sm text-theme-text/60 group-hover:text-theme-text transition-colors">Remember me</span>
          </label>
          <a href="#" className="text-sm font-medium text-theme-icon hover:underline">Forgot password?</a>
        </div>

        <Button 
          type="submit" 
          className="w-full py-3" 
          isLoading={isLoading}
          leftIcon={<LogIn size={18} />}
        >
          Sign In
        </Button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-theme-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-theme-surface px-4 text-theme-text/40 font-medium">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full"
            onClick={handleGoogleLogin}
            leftIcon={<Chrome size={18} />}
          >
            Google
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full"
            onClick={() => setIsDemoModalOpen(true)}
          >
            Demo Account
          </Button>
        </div>

        <p className="text-center text-sm text-theme-text/60 mt-8">
          Don't have an account?{' '}
          <Link to={SIGNUP} className="font-semibold text-theme-icon hover:underline">
            Sign up for free
          </Link>
        </p>
      </form>

      <DemoAccountModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
        onSelect={handleDemoSelect}
      />
    </AuthLayout>
  );
};

export default Login;
