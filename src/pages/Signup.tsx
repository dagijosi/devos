import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, UserPlus, Chrome } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Input from '../components/ui/forms/Input';
import Button from '../components/ui/forms/Button';
import { useAuthStore, type User } from '../store/authStore';
import { DASHBOARD, LOGIN } from '../routes/types/routeConstants';
import { toast } from 'sonner';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  agreeTerms: z.literal(true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockUser: User = {
        id: 'user-new',
        name: data.name,
        email: data.email,
        role: 'User',
        permissions: ['view_dashboard'],
        businessModules: ['Dashboard'],
      };
      setAuth('mock-token', mockUser);
      setIsLoading(false);
      toast.success('Account created successfully!');
      navigate(DASHBOARD);
    }, 1500);
  };

  const handleGoogleSignup = () => {
    toast.info('Google signup is not implemented in this demo');
  };

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join thousands of users managing their data today"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="John Doe"
          leftIcon={<UserIcon size={18} />}
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          label="Email Address"
          placeholder="name@company.com"
          leftIcon={<Mail size={18} />}
          {...register('email')}
          error={errors.email?.message}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
            showPasswordToggle
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={18} />}
            showPasswordToggle
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              {...register('agreeTerms')}
              className="mt-1 w-4 h-4 rounded border-theme-border text-theme-icon focus:ring-theme-icon bg-theme-background" 
            />
            <span className="text-sm text-theme-text/60 group-hover:text-theme-text transition-colors leading-tight">
              I agree to the <a href="#" className="text-theme-icon hover:underline font-medium">Terms of Service</a> and <a href="#" className="text-theme-icon hover:underline font-medium">Privacy Policy</a>
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="mt-1 text-xs text-red-500">{errors.agreeTerms.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full py-3 mt-4" 
          isLoading={isLoading}
          leftIcon={<UserPlus size={18} />}
        >
          Create Account
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-theme-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-theme-surface px-4 text-theme-text/40 font-medium">Or sign up with</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="secondary" 
          className="w-full"
          onClick={handleGoogleSignup}
          leftIcon={<Chrome size={18} />}
        >
          Google
        </Button>

        <p className="text-center text-sm text-theme-text/60 mt-6">
          Already have an account?{' '}
          <Link to={LOGIN} className="font-semibold text-theme-icon hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;
